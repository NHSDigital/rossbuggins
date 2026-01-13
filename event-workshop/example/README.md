# Event Workshop Example

A minimal TypeScript example showing a simple event-driven flow.

- Domain: pizza order workflow (order → payment → inventory → chef → kitchen aggregator).
- Focus: clarity of event shapes and flow, not AWS wiring.

## Prerequisites

- Node.js (LTS)

## Install

```bash
cd example
npm install
```

## Run (simple demo)

```bash
npm start
```

This runs a single happy-path in-memory simulation of the pizza workflow and logs CloudEvents and kitchen state transitions to the console.

## Run (interactive workshop demo)

To drive the workflow step-by-step from the terminal:

```bash
npm run interactive
```

You will be prompted for your name (used as the `customerId`), asked to choose a pizza, and then presented with a menu to trigger payment, inventory, and chef success/failure events. A timer will automatically emit an `order.timeout` event if you wait too long.

Use this interactive run during the workshop to explore choreography, timeouts, rollback, and how `subject` and `traceparent` correlate events.
