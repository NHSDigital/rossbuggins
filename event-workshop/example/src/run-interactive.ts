import readline from "readline";
import { InMemoryBus, createEvent } from "./bus";
import {
  registerKitchenHandlers,
  getKitchenState,
  resetKitchenState,
} from "./kitchen-service";
import { OrderCreatedData, OrderTimedOutData } from "./events";
import { emitPaymentCompleted, emitPaymentFailed } from "./payment-service";
import {
  emitInventoryReserved,
  emitInventoryFailed,
} from "./inventory-service";
import { emitChefAssigned, emitChefUnavailable } from "./chef-service";

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

function formatSimTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Welcome to the interactive pizza workflow demo!\n");
  const customerName = (await ask(rl, "Please enter your name: ")).trim();
  const customerId = customerName || "guest";
  const orderId = Math.floor(Math.random() * 90000 + 10000).toString();

  const pizzas = [
    { key: "1", name: "margherita", price: 9.99 },
    { key: "2", name: "pepperoni", price: 11.99 },
    { key: "3", name: "veggie", price: 10.99 },
  ];

  console.log("Please choose a pizza:\n");
  pizzas.forEach((p) => {
    console.log(` ${p.key}) ${p.name} (£${p.price.toFixed(2)})`);
  });

  const pizzaChoice = (await ask(rl, "Selection [1]: ")).trim() || "1";
  const selected = pizzas.find((p) => p.key === pizzaChoice) || pizzas[0];
  const pizzaType = selected.name;

  // Ensure any previous run's kitchen state is cleared so this
  // interactive session starts from a clean slate.
  resetKitchenState(orderId);

  const bus = new InMemoryBus();
  registerKitchenHandlers(bus);
  const start = Date.now();

  const order: OrderCreatedData = {
    pizzaType,
    totalAmount: selected.price,
  };

  console.log("\nPlacing order and emitting order.created...\n");

  const subject = `customer/${customerId}/orders/${orderId}`;
  const orderEvent = createEvent<OrderCreatedData>(
    "com.pizzaco.order.created",
    "order-service",
    order,
    { subject }
  );
  await bus.publish(orderEvent);

  const timeoutMs = 30000; // 30 seconds
  console.log(
    `A timer is running: if all required events are not in within ${
      timeoutMs / 1000
    }s, the order will time out and trigger rollback.\n`
  );

  const timeout = setTimeout(async () => {
    console.log("\n*** Timer expired: emitting order.timeout ***");
    const timeoutEvent = createEvent<OrderTimedOutData>(
      "com.pizzaco.order.timeout",
      "timeout-timer",
      {},
      {
        parent: orderEvent,
        subject,
      }
    );
    await bus.publish(timeoutEvent);
  }, timeoutMs);

  let lastAction: string | null = null;
  let done = false;
  while (!done) {
    console.clear();

    const elapsed = Date.now() - start;
    const remaining = Math.max(timeoutMs - elapsed, 0);
    console.log(
      `\n[CLOCK] t=${formatSimTime(elapsed)} remaining=${formatSimTime(
        remaining
      )}`
    );

    if (lastAction) {
      console.log(`\nLast action: ${lastAction}`);
    }

    console.log("\nWhat happens next?\n");
    console.log("1) Payment success");
    console.log("2) Payment failure");
    console.log("3) Inventory reserved");
    console.log("4) Inventory not available");
    console.log("5) Chef assigned");
    console.log("6) Chef unavailable");
    console.log("7) Quit (leave things as they are)");
    console.log("8) Show all events so far");
    console.log("9) Show current kitchen state");

    const choice = (await ask(rl, "> ")).trim();

    switch (choice) {
      case "1":
        await emitPaymentCompleted(bus, orderId);
        lastAction = "Payment success emitted";
        break;
      case "2":
        await emitPaymentFailed(bus, orderId, "user-declined");
        lastAction = "Payment failure emitted";
        done = true;
        break;
      case "3":
        await emitInventoryReserved(bus, orderId);
        lastAction = "Inventory reserved emitted";
        break;
      case "4":
        await emitInventoryFailed(bus, orderId, "ingredients-unavailable");
        lastAction = "Inventory failure emitted";
        done = true;
        break;
      case "5":
        await emitChefAssigned(bus, orderId);
        lastAction = "Chef assigned emitted";
        break;
      case "6":
        await emitChefUnavailable(bus, orderId, "no-chef-on-shift");
        lastAction = "Chef unavailable emitted";
        done = true;
        break;
      case "7":
        lastAction = "User chose to quit";
        done = true;
        break;
      case "8": {
        const events = bus
          .getEvents()
          .filter((evt) => (evt as any).subject === subject);

        console.log("\n--- Events so far ---");
        if (events.length === 0) {
          console.log("(no events yet)");
        } else {
          for (const evt of events) {
            console.dir(evt, { depth: null, colors: true, breakLength: 0 });
          }
        }
        lastAction = "Displayed events so far";
        break;
      }
      case "9": {
        const state = getKitchenState(orderId);
        console.log("\n--- Current kitchen state ---");
        console.log(state ?? "(no state recorded yet)");
        lastAction = "Displayed current kitchen state";
        break;
      }
      default:
        console.log("Please choose a number from 1 to 9.");
    }

    const state = getKitchenState(orderId);
    if (state && state.status !== "waiting") {
      console.log(`\nOrder reached terminal status: ${state.status}`);
      done = true;
    }
  }

  clearTimeout(timeout);

  const finalState = getKitchenState(orderId);

  console.log("\n=== Events for this order ===");
  const events = bus
    .getEvents()
    .filter((evt) => (evt as any).subject === subject);

  if (events.length === 0) {
    console.log("(no events)");
  } else {
    for (const evt of events) {
      console.dir(evt, { depth: null, colors: true, breakLength: 0 });
    }
  }

  console.log("\n=== Final Kitchen State ===");
  if (finalState) {
    console.dir(finalState, { depth: null, colors: true, breakLength: 0 });
  } else {
    console.log("(no state recorded)");
  }

  const again = (await ask(rl, "\nPlay again? (y/N): ")).trim().toLowerCase();

  rl.close();

  if (again === "y" || again === "yes") {
    console.clear();
    console.log("\nRestarting...\n");
    await main();
    return;
  }

  console.log("\nInteractive run complete.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
