# Event Workshop Example – Concept Guide

This example is the concrete anchor for the workshop. It turns a simple pizza order into a small, event-driven system that you can explore either from the CLI (`example/`) or in the browser (`web/`).

The goal is not to be production-ready, but to make the *right ideas* easy to see and talk about.

## What the system models

- A customer places an order for a pizza.
- Independent services react to that order:
  - Payment service authorises or fails payment.
  - Inventory service reserves or fails to reserve ingredients.
  - Chef service assigns or fails to assign a chef.
- The kitchen service **does not own any of those decisions**; it just listens and aggregates them into an overall order status.
- If everything goes well, the order becomes **READY**.
- If something fails or takes too long, the order becomes **FAILED** or **TIMEOUT**, and the kitchen logs compensating actions (refund, release inventory).

## Why this is a good example

### 1. Clear, small domain

Everyone understands ordering a pizza. That keeps attention on the event-driven patterns instead of domain complexity. The system fits in a single screen of code, but still has enough moving parts to show:

- Multiple services
- Multiple event types
- Happy paths and unhappy paths
- Time-based behaviour (timeouts)

### 2. Choreography, not orchestration

There is **no central "orchestrator"** telling services what to do next. Instead:

- `order-service` emits `com.pizzaco.order.created`.
- `payment-service`, `inventory-service`, and `chef-service` **subscribe** to that event and emit their own events in response.
- `kitchen-service` subscribes to those downstream events and decides when an order is READY, FAILED, or TIMED OUT.

This is classic **choreography**:

- Each service owns its data and decisions.
- Coupling is via events, not RPC calls.
- Adding a new downstream consumer is just another subscription.

### 3. Aggregator pattern

`kitchen-service` is an example of the **aggregator** pattern:

- It keeps a small in-memory state per order (payment received, inventory reserved, chef assigned, status).
- It doesn’t call out to other services; it just **derives** an outcome based on the events it sees.
- It demonstrates how to:
  - Aggregate multiple event streams into one business view.
  - Express terminal states (ready / failed / timeout).
  - Trigger compensating behaviour when things go wrong.

This is the same pattern you would use for order status, claim status, case status, etc. in a real system.

### 4. Failure, timeouts, and compensating actions

The example is deliberately not "all happy path":

- `payment.*`, `inventory.*`, and `chef.*` all have both **success** and **failure** events.
- A separate timeout timer emits `com.pizzaco.order.timeout` if the order takes too long.
- `kitchen-service` responds to those events by:
  - Marking the order as FAILED or TIMEOUT.
  - Logging compensating actions (e.g. refund, release inventory).

This shows:

- How to **model failures as events**, not just exceptions.
- How to keep compensating logic local to one place (the aggregator) while services stay simple.
- How "time" can be another event source.

### 5. CloudEvents done properly

All events are real **CloudEvents 1.0**:

- Created via a single `createEvent` helper.
- Always include `specversion`, `id`, `type`, `source`, `time`, and `datacontenttype`.
- Event payloads (`data`) are small and service-specific.

Two important CloudEvents fields are used to teach correlation:

- **`subject`**: we use `customer/{customerId}/orders/{orderId}` for every event in an order’s lifecycle.
  - The **order id and customer id are not in the payload** – they can be derived from `subject`.
- **`traceparent`**: we add a W3C Trace Context header to every event.
  - `order.created` starts a new trace.
  - Follow-on events reuse its trace-id with a new span-id.

This makes the example a good reference for doing CloudEvents "for real", not just as an afterthought.

### 6. Reusable, testable core

The in-memory bus and services are plain TypeScript:

- `InMemoryBus` is a tiny stand-in for an event bus like EventBridge.
- Services use `subscribe` and `publish` – no HTTP, no framework glue.
- Everything is small enough to read and reason about, but mirrors how real services would interact with an event bus.

Because of that, the same code runs:

- As a CLI simulation (`example/src/run-interactive.ts`).
- Inside a browser (`web/`), via a thin React wrapper.

That reinforces a useful idea: **your domain/event logic should not care about the UI**.

## How the web UI helps teach the concepts

The web app in `web/` wraps the exact same engine and adds a more visual teaching surface:

- **Name input** → becomes `customerId` in the CloudEvents `subject`.
- **Pizza choice** → becomes the order payload.
- **Buttons for each event** → map directly onto the domain actions:
  - Payment success/failure
  - Inventory reserved/failure
  - Chef assigned/unavailable
- **Countdown clock + bar** → shows the timeout window ticking down.
- **Status banner + fireworks** → make READY / FAILED / TIMEOUT very obvious.
- **State and events panels**:
  - Kitchen state (aggregated view) as JSON.
  - Full CloudEvents for this order, including `type`, `subject`, and `traceparent`.

This lets you:

- Walk through the happy path and show how events accumulate.
- Intentionally fail payment, inventory, or chef and observe the different terminal states.
- Let the timer expire and show how a timeout becomes just another event.
- Point directly at CloudEvents fields while they are on screen.

## How to use this in the workshop

- **Early in the workshop**: use the CLI version to show that it is just code – nothing magical, just services emitting and reacting to events.
- **During discussions**: refer to the aggregator and event definitions when you talk about choreography, correlation, and compensating actions.
- **For interactive exploration**: use the web UI so attendees can:
  - Drive the flow themselves.
  - See how small event shape decisions (subject, traceparent) show up in the tooling.

The aim is that by the end of the workshop, this example feels *obvious* – so participants can imagine their own domain sitting in the same patterns.

