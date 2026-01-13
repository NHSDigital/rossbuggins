import { InMemoryBus } from "./bus";
import { createOrder } from "./order-service";
import { registerPaymentHandler } from "./payment-service";
import { registerInventoryHandler } from "./inventory-service";
import { registerChefHandler } from "./chef-service";
import { registerKitchenHandlers } from "./kitchen-service";

async function main() {
  const bus = new InMemoryBus();

  // Register consumers
  registerPaymentHandler(bus);
  registerInventoryHandler(bus);
  registerChefHandler(bus);
  registerKitchenHandlers(bus);

  console.log("Starting example run...\n");

    const orderId = Math.floor(Math.random() * 90000 + 10000).toString();
    const customerId = "cust-1";

    await createOrder(bus, orderId, customerId, "margherita", 15.99);

  console.log("\nExample run complete.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
