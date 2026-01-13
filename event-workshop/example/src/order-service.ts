import { InMemoryBus, createEvent } from "./bus";
import { OrderCreatedData } from "./events";

export async function createOrder(
  bus: InMemoryBus,
  orderId: string,
  customerId: string,
  pizzaType: string,
  totalAmount: number
) {
  const subject = `customer/${customerId}/orders/${orderId}`;
  const data: OrderCreatedData = {
    pizzaType,
    totalAmount,
  };

  const evt = createEvent<OrderCreatedData>(
    "com.pizzaco.order.created",
    "order-service",
    data,
    { subject }
  );

  await bus.publish(evt);
}
