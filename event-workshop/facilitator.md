# Event-Driven Architecture Workshop – Facilitator Guide

This guide is for the person running the workshop. It assumes participants have access to `v2.md` as the reference pack and have basic familiarity with our AWS + TypeScript + Lambda + EventBridge stack.

---

## 1. Workshop Purpose & Outcomes

### Purpose
Help our dev and architecture teams move from “command-style Lambdas in a trench coat” to **clear, robust event-driven patterns** that survive real-world concurrency, retries, and change.

### Target Audience
- Backend / platform developers building or consuming events.
- Architects / tech leads designing workflows on EventBridge.
- People who influence patterns and standards.

### Learning Outcomes
By the end, participants should be able to:
- Explain the difference between **orchestration**, **choreography**, and **aggregation**.
- Design events that contain **only data owned by the emitting service**.
- Describe and sketch a simple **multi-event aggregator** (e.g. the pizza example).
- Reason about **concurrency issues** (duplicates, out-of-order, lost updates, hot keys).
- Know when to reach for **state tables**, **event sourcing**, or the **outbox pattern**.

Keep the tone practical and grounded in our real systems.

---

## 2. Format Options & Timings

You can run the workshop in different depths depending on time.

### Option A – 90 minutes (recommended)
- 0–10 min: Intro, context, why we’re here.
- 10–25 min: Core patterns & pizza scenario.
- 25–45 min: Concurrency + state management.
- 45–70 min: Activities 1–3 (group work).
- 70–85 min: Debrief, pattern selection, Q&A.
- 85–90 min: Close & next steps.

### Option B – 2–3 hours (deep dive)
- Include more detail on **event sourcing**, **outbox**, and **testing/observability**.
- Run **all** activities (1–5) with deeper discussion.

### Group Setup
- Aim for **4–6 people per table/group**.
- Mixed roles if possible (dev + architect + SRE).
- Whiteboard/flipchart or digital equivalents for diagrams.

---

## 3. Pre-Workshop Preparation

### Materials
- Share `invite.md` and time/location at least 1 week ahead.
- Make `v2.md` available (e.g. in repo or as a PDF/Confluence page).
- Prepare a few **printed copies of key diagrams** (pizza scenario, architecture overview).

### Environment
- Decide if you’re doing **code-level examples**:
  - If yes, ensure people have: Node/TypeScript, access to repo, editor, and (optionally) AWS sandbox.
  - If no, keep it **design-focused** and whiteboard only.

### Facilitator Familiarity
Before running the session, you should:
- Read `v2.md` end-to-end.
- Be comfortable explaining:
  - The **pizza** and/or **photo processing** scenarios.
  - Why over-stuffed events cause coupling.
  - Basic concurrency issues (duplicates, retries, races) with concrete examples.

---

## 4. Suggested Agenda & Talking Points

Below is a script-like outline you can follow. Adapt wording to your own style.

### 4.1 Opening (0–10 min)

**Goal:** Set context, get buy-in.

Talking points:
- "We’re already using events and EventBridge – this is about doing it **deliberately**, not by accident."
- "We want patterns that hold up under **retries, concurrency, and change**."
- "This isn’t a theory lecture – it’s about patterns you can apply in our codebase next sprint."

Ask the room:
- "Who’s had to debug a flow that hops through 3+ Lambdas and events?" (You’ll usually get smiles/groans.)
- "What’s the worst ‘mystery event’ you’ve seen?" (Keep this light; don’t turn it into a blame session.)

### 4.2 Core Patterns & Language (10–25 min)

Reference: **Core Concepts** and **Event-Driven Patterns Comparison** in `v2.md`.

Steps:
1. Sketch the **orchestrator vs choreography vs aggregator** diagrams.
2. Emphasise:
   - Services should emit **facts about their domain**, not forward everyone else’s data.
   - Correlation by **business ID** (e.g. `orderId`, `fileId`).
3. Use the **pizza example** briefly:
   - Payment, inventory, chef → kitchen waits for 3 events.

Questions to ask:
- "In our current systems, where do we see orchestration disguised as ‘just another Lambda’?"
- "If the payment service fails, which services *should* know? Which shouldn’t?"

Pitfalls to watch:
- Deep dives into specific legacy systems. Acknowledge them but park details for later.

### 4.3 Concurrency & State (25–45 min)

Reference: **Concurrency & High-Throughput Considerations** and **State Management Strategies** in `v2.md`.

Key messages:
- Event-driven == **concurrent by default**.
- Problems to surface:
  - Duplicates and at-least-once delivery.
  - Out-of-order events.
  - Lost updates when multiple handlers write the same record.
- Introduce:
  - Idempotent handlers (per business key).
  - State table keyed by correlation ID.
  - Versioning / optimistic locking (keep this conceptual if time is short).

Facilitator tips:
- Use a simple timeline on the board:
  - "Payment succeeded" (then retries) → how many times do we charge the card?
- Ask groups: "What would *you* store in a `KitchenState`/`OrderState` record?" (Drive towards minimal, domain owned data.)

Optional depth (if time):
- Briefly describe **event sourcing** and **outbox**:
  - Event sourcing as "append-only history + projections".
  - Outbox as "write state and outgoing event together, then reliably publish".

---

## 5. Running the Activities

You do **not** need to run all activities. Pick based on time.

### Activity 1 – Spot the Anti-Pattern (15 min)

Reference: **Activity 1** in `v2.md`.

Goal:
- Help participants see **over-stuffed events** and misplaced responsibility.

Instructions:
1. Show the virus-scanner event payload from `v2.md`.
2. Ask groups to mark:
   - What belongs to the **virus scanner** domain.
   - What belongs to **upload/metadata/storage**.
3. Have each group propose a "fixed" event shape and list of other events the saver/storage service should listen to.

Debrief prompts:
- "Which fields did you move out of this event, and why?"
- "What happens if we add one more downstream service – who breaks?"

Expected insights:
- Virus scanner should emit primarily **fileId + scan result**.
- Description, metadata, S3 location, etc. belong to other services/events.

---

### Activity 2 – Design a Multi-Event Flow (20–25 min)

Reference: **Activity 2** in `v2.md`.

Goal:
- Practice designing multiple **small, focused events** and an aggregator.

Scenario (remind them):
- Photo upload must pass through upload → virus scan → image processing → metadata extractor → storage service that waits for all required results.

Instructions:
1. Each group designs:
   - Event types and minimal payloads.
   - A correlation ID strategy (e.g. `fileId`).
   - Which service listens to which events.
2. Optional: ask them to pick **exact CloudEvents type strings**.

Debrief prompts:
- "Which service owns the ‘save to S3’ decision?"
- "How does your storage service know it’s safe to proceed?"

Things to reinforce:
- Storage service should not be passed every field from upstream; it should **listen to multiple independent events**.
- Smaller, domain-focused events are easier to extend.

---

### Activity 3 – State & Concurrency (30 min)

Reference: **Activity 3** in `v2.md`.

Goal:
- Make participants think explicitly about state, idempotency, and timeouts.

Instructions:
1. Show the `kitchen-service/handler.ts` stub from `v2.md`.
2. In groups, have them outline (whiteboard or pseudo-code):
   - How they’d store state (fields, keys, TTL).
   - How they’d detect "all 3 events have arrived".
   - How they’d handle duplicates.
   - What happens after **30 minutes** with only 1–2 events.

If doing code:
- Give them a simple TypeScript skeleton and have them implement the state update logic.

Debrief prompts:
- "What did you choose as the primary key in your state table?"
- "How do you avoid charging twice or baking twice?"
- "What’s your timeout behaviour – cancel, compensate, alert?"

Reinforce:
- Idempotency (based on `orderId` + `paymentId` / `reservationId`, etc.).
- Timeouts as **first-class** behaviour, not an afterthought.

---

### Optional Activities 4–5

If you have more time, you can:
- Run **Activity 4** (failure handling) to explore compensations and failure events.
- Run **Activity 5** (pattern selection) as a way to:
  - Check understanding.
  - Map patterns to *our* problem space.

For each scenario, ask groups to choose a pattern and justify it, then facilitate a short debate.

---

## 6. Common Pitfalls & How to Steer the Room

You’ll likely encounter these during discussion:

1. **"Let’s just put everything in one big event"**  
   - Re-centre on **ownership**: "Which service *owns* that data? Who is the source of truth?"  
   - Ask: "If we need a new consumer tomorrow, do we really want it to depend on this one service?"

2. **Premature deep dives into legacy systems**  
   - Acknowledge pain points; capture them in a parking lot.  
   - Keep the main session on **patterns**, not specific migrations.

3. **Confusing outbox with event sourcing**  
   - Clarify: outbox = **reliable delivery of events**; event sourcing = **events as the primary source of truth**.

4. **Trying to eliminate all eventual consistency**  
   - Emphasise trade-offs: "We can choose where we tolerate small delays and where we need stronger guarantees."

5. **Over-engineering everything as a saga/event-sourced system**  
   - Use the "**default patterns**" from `v2.md`: start with simple choreography + state table unless you have clear reasons not to.

---

## 7. Tailoring to Our Organisation

Suggestions:
- Before or after the workshop, collect **one or two real flows** from our systems (sanitised if needed) and map them to:
  - Current shape (with problems).
  - Target shape using patterns from the workshop.
- During the session, keep examples generic; during follow-up, run a **focused design session** per team.

Questions you can ask leadership/teams afterwards:
- "Which flows would benefit most from an aggregator/state-table approach?"
- "Where are we currently relying on implicit orchestration inside a single Lambda?"
- "Do we have places where an outbox pattern would significantly reduce risk?"

---

## 8. Closing the Workshop

In the last 5–10 minutes:
- Ask each group for **one concrete change** they’d like to see in our event-driven systems (or one pattern they’ll try next).
- Summarise key phrases to repeat later:
  - "Emit facts from your domain."  
  - "Correlate by business ID."  
  - "Design for retries, duplicates, and out-of-order by default."  
  - "State lives somewhere – make it explicit."

Agree a simple follow-up:
- A shared page or doc capturing agreed **guidelines** and **examples**.
- Optional: a short follow-up session for teams who want to apply this to a specific flow.

The aim is that the workshop is a **starting point**, not a one-off lecture.
