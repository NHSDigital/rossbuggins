# Event Workshop Web UI

This is a small React + Vite app that wraps the existing event-driven pizza workflow demo in a browser UI. It reuses the same TypeScript "engine" from `example/src` (bus, events, services, kitchen-service) and just replaces the interactive CLI with buttons and panels.

## Prerequisites

- Node.js (LTS)

## Install

From the repo root:

```bash
cd web
npm install
```

## Run in dev mode

```bash
npm run dev
```

Then open the printed `http://localhost:5173` URL in your browser.

## Build for static hosting (e.g. GitHub Pages)

```bash
npm run build
```

This generates a static site into `web/dist`. You can point GitHub Pages at that folder or copy its contents into a `/docs` folder on your main branch.

## How it maps to the workshop

- Name input becomes the `customerId` and is encoded into the CloudEvents `subject` as `customer/{name}/orders/{orderId}`.
- Pizza selection and pricing match the CLI interactive demo.
- Buttons trigger the same domain actions as the CLI (`payment.success`, `payment.failed`, `inventory.reserved`, `inventory.failed`, `chef.assigned`, `chef.unavailable`).
- A 30s timer automatically emits `order.timeout` if nothing completes in time.
- The right-hand panels show the current kitchen aggregator state and the full CloudEvents for this order, so you can talk through choreography, correlation via subject/traceparent, and rollback.
