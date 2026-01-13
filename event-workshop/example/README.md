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

## Run

```bash
npm start
```

This will run a small in-memory simulation of the pizza workflow, logging events and state transitions to the console.

Use the code as a reference when discussing patterns in the workshop.
