import { CloudEvent } from "cloudevents";

export interface OrderCreatedData {
  pizzaType: string;
  totalAmount: number;
}

export interface PaymentCompletedData {
  paymentId: string;
  status: "approved" | "declined";
}

export interface InventoryReservedData {
  reservationId: string;
}

export interface ChefAssignedData {
  chefId: string;
}

export interface PaymentFailedData {
  reason: string;
}

export interface InventoryFailedData {
  reason: string;
}

export interface ChefUnavailableData {
  reason: string;
}

export interface OrderTimedOutData {
}

export type OrderCreatedEvent = CloudEvent<OrderCreatedData>;
export type PaymentCompletedEvent = CloudEvent<PaymentCompletedData>;
export type InventoryReservedEvent = CloudEvent<InventoryReservedData>;
export type ChefAssignedEvent = CloudEvent<ChefAssignedData>;
export type PaymentFailedEvent = CloudEvent<PaymentFailedData>;
export type InventoryFailedEvent = CloudEvent<InventoryFailedData>;
export type ChefUnavailableEvent = CloudEvent<ChefUnavailableData>;
export type OrderTimedOutEvent = CloudEvent<OrderTimedOutData>;

export type AnyDomainEvent =
  | OrderCreatedEvent
  | PaymentCompletedEvent
  | InventoryReservedEvent
  | ChefAssignedEvent
  | PaymentFailedEvent
  | InventoryFailedEvent
  | ChefUnavailableEvent
  | OrderTimedOutEvent;

export function logEvent(evt: AnyDomainEvent): void {
  console.log(`\n=== Event: ${evt.type} ===`);
  console.log("id:", evt.id);
  console.log("source:", evt.source);
  console.log("time:", evt.time);
  console.log("traceparent:", (evt as any).traceparent ?? "(none)");
  console.log("subject:", (evt as any).subject ?? "(none)");
  console.log("data:");
  console.dir(evt.data, { depth: null, colors: true, breakLength: 0 });
}

export function parseOrderSubject(subject: string | undefined):
  | { customerId: string; orderId: string }
  | null {
  if (!subject) return null;
  const parts = subject.split("/");
  if (parts.length !== 4) return null;
  const [prefix, customerId, ordersLabel, orderId] = parts;
  if (prefix !== "customer" || ordersLabel !== "orders") return null;
  return { customerId, orderId };
}
