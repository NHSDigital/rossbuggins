import { InMemoryBus, createEvent } from "./bus";
import { ChefAssignedData, ChefUnavailableData, parseOrderSubject } from "./events";

const CHEF_IDS = [
  "chef-mario",
  "chef-luigi",
  "chef-peach",
  "chef-toad",
  "chef-yoshi",
];

function pickRandomChefId(): string {
  const index = Math.floor(Math.random() * CHEF_IDS.length);
  return CHEF_IDS[index];
}

export function registerChefHandler(bus: InMemoryBus) {
  // Original automatic handler kept for the simple, non-interactive run.
  bus.subscribe("com.pizzaco.order.created", async (event) => {
    const evt = event as any;
    const subject = (evt as any).subject as string | undefined;

    const parsed = parseOrderSubject(subject);
    const orderId = parsed?.orderId ?? "unknown";

    const chef: ChefAssignedData = {
      chefId: pickRandomChefId(),
    };

    const chefEvent = createEvent<ChefAssignedData>(
      "com.pizzaco.chef.assigned",
      "chef-service",
      chef,
      { parent: event, subject }
    );

    await bus.publish(chefEvent);
  });
}

export async function emitChefAssigned(
  bus: InMemoryBus,
  orderId: string
): Promise<void> {
  const chef: ChefAssignedData = {
    chefId: pickRandomChefId(),
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

  const chefEvent = createEvent<ChefAssignedData>(
    "com.pizzaco.chef.assigned",
    "chef-service",
    chef,
    {
      parent: orderEvent,
      subject:
        (orderEvent as any)?.subject ?? `customer/unknown/orders/${orderId}`,
    }
  );

  await bus.publish(chefEvent);
}

export async function emitChefUnavailable(
  bus: InMemoryBus,
  orderId: string,
  reason: string
): Promise<void> {
  const failure: ChefUnavailableData = {
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

  const failureEvent = createEvent<ChefUnavailableData>(
    "com.pizzaco.chef.unavailable",
    "chef-service",
    failure,
    {
      parent: orderEvent,
      subject:
        (orderEvent as any)?.subject ?? `customer/unknown/orders/${orderId}`,
    }
  );

  await bus.publish(failureEvent);
}
