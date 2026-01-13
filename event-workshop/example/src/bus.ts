import { v4 as uuid } from "uuid";
import { CloudEvent } from "cloudevents";
import { AnyDomainEvent, logEvent } from "./events";

export type EventHandler = (event: AnyDomainEvent) => Promise<void> | void;

interface Subscription {
  type: string;
  handler: EventHandler;
}

export class InMemoryBus {
  private subscriptions: Subscription[] = [];
  private events: AnyDomainEvent[] = [];

  subscribe(type: string, handler: EventHandler): void {
    this.subscriptions.push({ type, handler });
  }

  getEvents(): AnyDomainEvent[] {
    return this.events;
  }

  async publish<T>(event: CloudEvent<T>): Promise<void> {
    const domainEvent = event as AnyDomainEvent;

    this.events.push(domainEvent);
    logEvent(domainEvent);

    const matching = this.subscriptions.filter((s) => s.type === event.type);

    for (const sub of matching) {
      await sub.handler(domainEvent);
    }
  }
}

export function createEvent<T>(
  type: string,
  source: string,
  data: T,
  options?: { parent?: CloudEvent<unknown>; subject?: string }
): CloudEvent<T> {
  const parentAny = options?.parent as any;
  const existingTraceparent =
    parentAny && typeof parentAny.traceparent === "string"
      ? (parentAny.traceparent as string)
      : undefined;

  const traceparent = existingTraceparent
    ? deriveChildTraceparent(existingTraceparent)
    : generateTraceparent();

  const attributes: any = {
    specversion: "1.0",
    type,
    source,
    id: uuid(),
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data,
    traceparent,
  };

  if (options?.subject) {
    attributes.subject = options.subject;
  }

  return new CloudEvent<T>(attributes);
}

function generateTraceparent(): string {
  const traceId = randomHex(16); // 32 hex chars
  const spanId = randomHex(8); // 16 hex chars
  return `00-${traceId}-${spanId}-01`;
}

function deriveChildTraceparent(parentTraceparent: string): string {
  const parts = parentTraceparent.split("-");
  if (parts.length !== 4) {
    return generateTraceparent();
  }

  const [version, traceId, _parentSpanId, flags] = parts;
  const spanId = randomHex(8);
  return `${version}-${traceId}-${spanId}-${flags}`;
}

function randomHex(byteLength: number): string {
  // Prefer Web Crypto API when available (browsers, some runtimes)
  const globalAny: any = globalThis as any;
  const cryptoObj = globalAny.crypto || globalAny.msCrypto;

  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const bytes = new Uint8Array(byteLength);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback for Node or other environments without Web Crypto
  let out = "";
  for (let i = 0; i < byteLength; i++) {
    const n = Math.floor(Math.random() * 256);
    out += n.toString(16).padStart(2, "0");
  }
  return out;
}
