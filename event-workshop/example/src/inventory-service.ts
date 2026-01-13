import { InMemoryBus, createEvent } from "./bus";
import {
  InventoryReservedData,
  InventoryFailedData,
  parseOrderSubject,
} from "./events";

export function registerInventoryHandler(bus: InMemoryBus) {
  // Original automatic handler kept for the simple, non-interactive run.
  bus.subscribe("com.pizzaco.order.created", async (event) => {
    const evt = event as any;
    const subject = (evt as any).subject as string | undefined;

    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";

    const reservation: InventoryReservedData = {
      reservationId: `res-${orderId}`,
    };

    const reservationEvent = createEvent<InventoryReservedData>(
      "com.pizzaco.inventory.reserved",
      "inventory-service",
      reservation,
      { parent: event, subject }
    );

    await bus.publish(reservationEvent);
  });
}

export async function emitInventoryReserved(
  bus: InMemoryBus,
  orderId: string
): Promise<void> {
  const reservation: InventoryReservedData = {
    reservationId: `res-${orderId}`,
  };

  const orderEvent = bus
    .getEvents()
    .find((e) => {
      if (e.type !== "com.pizzaco.order.created") return false;
      const subject = (e as any).subject as string | undefined;
      if (!subject) return false;
      const parsed = parseOrderSubject(subject);
      return parsed?.orderId === orderId;
    });

  const reservationEvent = createEvent<InventoryReservedData>(
    "com.pizzaco.inventory.reserved",
    "inventory-service",
    reservation,
    {
      parent: orderEvent,
      subject:
        (orderEvent as any)?.subject ?? `customer/unknown/orders/${orderId}`,
    }
  );

  await bus.publish(reservationEvent);
}

export async function emitInventoryFailed(
  bus: InMemoryBus,
  orderId: string,
  reason: string
): Promise<void> {
  const failure: InventoryFailedData = {
    reason,
  };

  const orderEvent = bus
    .getEvents()
    .find((e) => {
      if (e.type !== "com.pizzaco.order.created") return false;
      const subject = (e as any).subject as string | undefined;
      if (!subject) return false;
      const parsed = parseOrderSubject(subject);
      return parsed?.orderId === orderId;
    });

  const failureEvent = createEvent<InventoryFailedData>(
    "com.pizzaco.inventory.failed",
    "inventory-service",
    failure,
    {
      parent: orderEvent,
      subject:
        (orderEvent as any)?.subject ?? `customer/unknown/orders/${orderId}`,
    }
  );

  await bus.publish(failureEvent);
}
