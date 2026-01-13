import { InMemoryBus, createEvent } from "./bus";
import {
  PaymentCompletedData,
  PaymentFailedData,
  parseOrderSubject,
} from "./events";

export function registerPaymentHandler(bus: InMemoryBus) {
  // Original automatic handler kept for the simple, non-interactive run.
  bus.subscribe("com.pizzaco.order.created", async (event) => {
    const evt = event as any;
    const subject = (evt as any).subject as string | undefined;

    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";

    const payment: PaymentCompletedData = {
      paymentId: `pay-${orderId}`,
      status: "approved",
    };

    const paymentEvent = createEvent<PaymentCompletedData>(
      "com.pizzaco.payment.completed",
      "payment-service",
      payment,
      { parent: event, subject }
    );

    await bus.publish(paymentEvent);
  });
}

export async function emitPaymentCompleted(
  bus: InMemoryBus,
  orderId: string
): Promise<void> {
  const payment: PaymentCompletedData = {
    paymentId: `pay-${orderId}`,
    status: "approved",
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

  const paymentEvent = createEvent<PaymentCompletedData>(
    "com.pizzaco.payment.completed",
    "payment-service",
    payment,
    {
      parent: orderEvent,
      subject:
        (orderEvent as any)?.subject ?? `customer/unknown/orders/${orderId}`,
    }
  );

  await bus.publish(paymentEvent);
}

export async function emitPaymentFailed(
  bus: InMemoryBus,
  orderId: string,
  reason: string
): Promise<void> {
  const failure: PaymentFailedData = {
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

  const failureEvent = createEvent<PaymentFailedData>(
    "com.pizzaco.payment.failed",
    "payment-service",
    failure,
    {
      parent: orderEvent,
      subject:
        (orderEvent as any)?.subject ?? `customer/unknown/orders/${orderId}`,
    }
  );

  await bus.publish(failureEvent);
}
