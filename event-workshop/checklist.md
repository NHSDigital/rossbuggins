# Event-Driven Architecture Checklist

A quick reference for designing and reviewing event-driven flows (AWS + TypeScript + Lambdas + EventBridge).

---

## 1. Event Design

- [ ] **Domain-owned data only**: Event contains only data the emitting service owns.
- [ ] **Clear purpose**: You can finish the sentence "This event means that…" in one line.
- [ ] **Semantic type name**: Uses `domain.entity.action` style (e.g. `com.pizzaco.payment.completed`).
- [ ] **CloudEvents-compliant**: `id`, `source`, `type`, `time`, `specversion`, `datacontenttype`, `data` are set.
- [ ] **Correlation ID present**: Business ID in `data` (e.g. `orderId`, `fileId`).
- [ ] **No foreign state**: No copies of other services’ internal state just "passed through".
- [ ] **Immutable**: Once published, the meaning and shape of the event do not change.
- [ ] **Versioned**: There is a plan for schema evolution (e.g. `type` version suffix or version field).
- [ ] **Size reasonable**: Payload comfortably < 256KB; large blobs go to S3 with references in the event.
- [ ] **No secrets in clear**: Sensitive fields are omitted, tokenised, or encrypted.

---

## 2. Service Responsibilities

- [ ] **Emits facts, not commands**: Event describes *what happened*, not "do X next".
- [ ] **Single responsibility per service**: Each service does one domain job (e.g. "scan", "charge", "reserve").
- [ ] **Knows its own events**: Service emits and documents its event types.
- [ ] **Minimal knowledge of others**: Service listens to other domains’ events but does not embed their logic.
- [ ] **No forwarding chains**: Services don’t simply re-emit other services’ data unchanged as their own.

---

## 3. Workflow Pattern Choice

For this flow, we intentionally chose:

- [ ] **Choreography** (default): Independent services react to events; no central coordinator.
- [ ] **Aggregator**: A service waits for N events keyed by a correlation ID and then emits a combined event.
- [ ] **Orchestrator**: A central workflow service is explicitly coordinating steps (kept as small and focused as possible).
- [ ] **Event-carrying state transfer**: Events intentionally replicate read-heavy reference data.

And we can answer:

- [ ] **Why this pattern?** The trade-offs vs other patterns are understood and documented.

---

## 4. State & Concurrency

- [ ] **State location is explicit**: We know *where* we track multi-event state (DynamoDB, Redis, event store, etc.).
- [ ] **Keyed by correlation ID**: State table primary key is the business ID (e.g. `orderId`).
- [ ] **Idempotent handlers**: Same event (same ID) can be processed more than once with no bad side effects.
- [ ] **Duplicates handled**: There is a deduplication strategy (e.g. storing `eventId` / `paymentId` in state).
- [ ] **Out-of-order safe**: Logic does not assume events arrive in a specific order.
- [ ] **Optimistic locking or equivalent**: We avoid silent lost updates (version field, conditional updates, or append-only events).
- [ ] **Hot keys considered**: High-volume IDs are identified and, if needed, sharded or serialised.
- [ ] **Timeout behaviour defined**: We know what happens if all required events don’t arrive in time.

---

## 5. Failure & Compensation

- [ ] **Failure events exist**: There are explicit events for failures (e.g. `payment.failed`, `inventory.unavailable`).
- [ ] **Downstream reactions agreed**: Each failure event has clear consumers and behaviour.
- [ ] **Compensation designed**: We know how to undo or compensate (refunds, releasing reservations, cancelling orders).
- [ ] **Timeouts produce signals**: Timeouts emit an event and/or alert, not just silent expiry.
- [ ] **Dead-letter handling configured**: DLQs / DLQs for EventBridge / Lambda are set up and monitored.

---

## 6. Reliability & Delivery

- [ ] **At-least-once assumed**: Handlers are written assuming events may be delivered more than once.
- [ ] **Outbox used where needed**: For critical transitions, state changes and outgoing events are written together (outbox / transaction / stream).
- [ ] **No hidden side effects**: Publishing an event is not the only way something important is recorded; state of record is clear.

---

## 7. Observability & Testing

- [ ] **Structured logging includes correlation ID**: Logs can be grouped by `orderId` / `fileId`.
- [ ] **Metrics for flow health**: We track success, failure, timeout, and latency across steps.
- [ ] **Dashboards for stuck items**: It’s easy to spot items stuck in `waiting` or `processing` for too long.
- [ ] **Unit tests for handlers**: Tests cover happy path and idempotency.
- [ ] **Integration tests for flows**: At least one end-to-end test per key workflow.

---

## 8. Quick Review Questions

When reviewing or designing a new flow, ask:

- [ ] "What is the **business ID** that ties these events together?"
- [ ] "Which service **owns** this piece of data?"
- [ ] "Where does the **state** of this workflow live?"
- [ ] "What happens if this event is delivered **twice**?"
- [ ] "What happens if events arrive in the **wrong order**?"
- [ ] "What happens if the **last event never arrives**?"
- [ ] "Who needs to know if this step **fails**?"
- [ ] "If we add a new consumer tomorrow, how painful will it be?"
