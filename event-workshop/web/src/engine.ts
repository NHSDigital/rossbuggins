import { InMemoryBus } from "@example/bus";
import { createEvent } from "@example/bus";
import {
  OrderCreatedData,
  OrderTimedOutData,
  AnyDomainEvent,
} from "@example/events";
import { registerKitchenHandlers, getKitchenState } from "@example/kitchen-service";
import {
  emitPaymentCompleted,
  emitPaymentFailed,
} from "@example/payment-service";
import {
  emitInventoryReserved,
  emitInventoryFailed,
} from "@example/inventory-service";
import { emitChefAssigned, emitChefUnavailable } from "@example/chef-service";

export type PizzaChoice = {
  name: string;
  price: number;
};

export type SessionState = {
  bus: InMemoryBus;
  orderId: string;
  customerId: string;
  subject: string;
  start: number;
  timeoutMs: number;
};

export function startSession(customerId: string, pizza: PizzaChoice): SessionState {
  const orderId = Math.floor(Math.random() * 90000 + 10000).toString();
  const subject = `customer/${customerId || "guest"}/orders/${orderId}`;

  const bus = new InMemoryBus();
  registerKitchenHandlers(bus);

  const order: OrderCreatedData = {
    pizzaType: pizza.name,
    totalAmount: pizza.price,
  };

  const orderEvent = createEvent<OrderCreatedData>(
    "com.pizzaco.order.created",
    "order-service",
    order,
    { subject }
  );

  void bus.publish(orderEvent);

  const timeoutMs = 30000;
  const start = Date.now();

  // schedule timeout event
  setTimeout(() => {
    const timeoutEvent = createEvent<OrderTimedOutData>(
      "com.pizzaco.order.timeout",
      "timeout-timer",
      {},
      {
        parent: orderEvent,
        subject,
      }
    );
    void bus.publish(timeoutEvent);
  }, timeoutMs);

  return { bus, orderId, customerId, subject, start, timeoutMs };
}

export function getEventsForSubject(state: SessionState): AnyDomainEvent[] {
  return state.bus.getEvents().filter((evt) => (evt as any).subject === state.subject);
}

export function getKitchenStateForOrder(state: SessionState) {
  return getKitchenState(state.orderId);
}

export const actions = {
  paymentSuccess(state: SessionState) {
    return emitPaymentCompleted(state.bus, state.orderId);
  },
  paymentFailure(state: SessionState) {
    return emitPaymentFailed(state.bus, state.orderId, "user-declined");
  },
  inventoryReserved(state: SessionState) {
    return emitInventoryReserved(state.bus, state.orderId);
  },
  inventoryFailed(state: SessionState) {
    return emitInventoryFailed(state.bus, state.orderId, "ingredients-unavailable");
  },
  chefAssigned(state: SessionState) {
    return emitChefAssigned(state.bus, state.orderId);
  },
  chefUnavailable(state: SessionState) {
    return emitChefUnavailable(state.bus, state.orderId, "no-chef-on-shift");
  },
};
