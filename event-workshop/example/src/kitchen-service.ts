import { InMemoryBus } from "./bus";
import {
  PaymentCompletedEvent,
  InventoryReservedEvent,
  ChefAssignedEvent,
  PaymentFailedEvent,
  InventoryFailedEvent,
  ChefUnavailableEvent,
  OrderTimedOutEvent,
  parseOrderSubject,
} from "./events";

interface KitchenState {
  orderId: string;
  paymentReceived: boolean;
  inventoryReceived: boolean;
  chefReceived: boolean;
   status: "waiting" | "ready" | "failed" | "timeout";
}

const stateByOrder = new Map<string, KitchenState>();

function getOrCreateState(orderId: string): KitchenState {
  const existing = stateByOrder.get(orderId);
  if (existing) return existing;

  const created: KitchenState = {
    orderId,
    paymentReceived: false,
    inventoryReceived: false,
    chefReceived: false,
    status: "waiting",
  };

  stateByOrder.set(orderId, created);
  return created;
}

function maybeReady(state: KitchenState) {
  if (
    state.status === "waiting" &&
    state.paymentReceived &&
    state.inventoryReceived &&
    state.chefReceived
  ) {
    state.status = "ready";
    console.log(
      `\n>>> Kitchen: order ${state.orderId} is READY (all events received).`
    );
  }
}

function logRollback(state: KitchenState, reason: string) {
  console.log(
    `\n>>> Kitchen: order ${state.orderId} FAILED (${reason}). Rolling back where needed...`
  );

  if (state.paymentReceived) {
    console.log(` - Would issue refund for order ${state.orderId}`);
  }
  if (state.inventoryReceived) {
    console.log(` - Would release inventory reservation for order ${state.orderId}`);
  }
}

export function registerKitchenHandlers(bus: InMemoryBus) {
  bus.subscribe("com.pizzaco.payment.completed", (event) => {
    const evt = event as PaymentCompletedEvent;
    const subject = (evt as any).subject as string | undefined;
    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";
    const state = getOrCreateState(orderId);
    state.paymentReceived = true;
    console.log(`Kitchen state updated for ${state.orderId}: payment received`);
    maybeReady(state);
  });

  bus.subscribe("com.pizzaco.inventory.reserved", (event) => {
    const evt = event as InventoryReservedEvent;
    const subject = (evt as any).subject as string | undefined;
    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";
    const state = getOrCreateState(orderId);
    state.inventoryReceived = true;
    console.log(`Kitchen state updated for ${state.orderId}: inventory reserved`);
    maybeReady(state);
  });

  bus.subscribe("com.pizzaco.chef.assigned", (event) => {
    const evt = event as ChefAssignedEvent;
    const subject = (evt as any).subject as string | undefined;
    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";
    const state = getOrCreateState(orderId);
    state.chefReceived = true;
    console.log(`Kitchen state updated for ${state.orderId}: chef assigned`);
    maybeReady(state);
  });

  bus.subscribe("com.pizzaco.payment.failed", (event) => {
    const evt = event as PaymentFailedEvent;
    const subject = (evt as any).subject as string | undefined;
    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";
    const state = getOrCreateState(orderId);
    if (state.status === "waiting") {
      state.status = "failed";
      logRollback(state, `payment failed: ${evt.data?.reason}`);
    }
  });

  bus.subscribe("com.pizzaco.inventory.failed", (event) => {
    const evt = event as InventoryFailedEvent;
    const subject = (evt as any).subject as string | undefined;
    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";
    const state = getOrCreateState(orderId);
    if (state.status === "waiting") {
      state.status = "failed";
      logRollback(state, `inventory failed: ${evt.data?.reason}`);
    }
  });

  bus.subscribe("com.pizzaco.chef.unavailable", (event) => {
    const evt = event as ChefUnavailableEvent;
    const subject = (evt as any).subject as string | undefined;
    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";
    const state = getOrCreateState(orderId);
    if (state.status === "waiting") {
      state.status = "failed";
      logRollback(state, `chef unavailable: ${evt.data?.reason}`);
    }
  });

  bus.subscribe("com.pizzaco.order.timeout", (event) => {
    const evt = event as OrderTimedOutEvent;
    const subject = (evt as any).subject as string | undefined;
    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";
    const state = getOrCreateState(orderId);
    if (state.status === "waiting") {
      state.status = "timeout";
      logRollback(state, "timeout waiting for all events");
    }
  });
}

export function getKitchenState(orderId: string): KitchenState | undefined {
  return stateByOrder.get(orderId);
}

export function resetKitchenState(orderId?: string): void {
  if (orderId) {
    stateByOrder.delete(orderId);
  } else {
    stateByOrder.clear();
  }
}
