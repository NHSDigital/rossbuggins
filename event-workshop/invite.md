# Event-Driven Architecture Workshop

## From Commands to Events That Actually Work in Production

### Why You’re Getting This Invite

We’ve moved a long way towards **event-driven design**. Our stack is full of **TypeScript Lambdas**, **queues**, and **CloudEvents** on **EventBridge**.

But if we’re honest, a lot of our systems still behave like the old world:
- Lambdas calling each other in long chains
- Events that carry way too much data "just in case"
- Services that know far too much about each other’s internals
- Workflows that are hard to reason about, debug, or change

This workshop is about fixing that.

We’ll explore **clear, practical patterns** so our events are:
- Easier to **reason about**
- Safer under **concurrency, retries, and duplicates**
- Aligned with **team and domain boundaries**
- Robust enough for **real-world production traffic**

If you work with our event-driven systems, this is for you.

---

### Who This Is For

- **Developers** building or maintaining Lambda-based services
- **Architects / Tech Leads** designing event-driven workflows
- **Engineers** who keep asking:
  - "What should go into this event?"
  - "Who should coordinate this workflow?"
  - "How do we avoid horrible coupling across services?"
  - "What happens when events arrive twice or out of order?"

You don’t need to be an event-driven expert. Familiarity with our AWS/TypeScript setup is enough.

---

### What We’ll Cover (Without the Fluff)

**1. Events Done Right**  
We’ll nail the fundamentals:

- What belongs in an event (and what really doesn’t)
- How to design events around **domains**, not implementation details
- Using **CloudEvents** consistently across services

**2. Choreography, Aggregators, and When to Orchestrate**  
We’ll compare patterns using a fun scenario (pizza orders / photo processing):

- Simple **event choreography** – services reacting to each other’s events
- **Aggregator** patterns – waiting for 2–3 events before taking action
- When to admit you actually need a **central orchestrator**

**3. Concurrency and the Real World**  
What actually happens in production:

- Events for the same ID arriving at the **same time**
- **Duplicates**, **retries**, and **out-of-order** delivery
- Avoiding **lost updates** when multiple Lambdas write to the same item

We’ll look at concrete patterns like:

- **Idempotent handlers**
- **Optimistic locking** and version fields in DynamoDB
- Sensible partitioning to avoid **hot keys**

**4. Reliable Events: Outbox and Event Sourcing (Light-Touch)**  
When you really care about never losing an event:

- The **Outbox pattern** – writing state and event together, then publishing
- Where **event sourcing** shines and where it’s just pain
- How these patterns fit into our existing AWS stack

**5. Hands-On Design and Code**  
You’ll sketch and/or code:

- A small multi-step workflow that waits on 3 independent events
- Event payloads that follow our standards
- A simple state management approach to track which events have arrived

---

### Why We’re Doing This Now
Our systems are only getting:
- **More event-driven**
- **More distributed**
- **More business-critical**

The cost of getting patterns wrong goes up over time:
- Hard-to-change workflows baked into the wrong service
- Debugging by following a **maze of events and Lambdas**
- Subtle bugs that show up only under **load**, **retries**, or **partial failure**

This workshop is about agreeing on **practical, shared patterns** so that:
- New services are designed well from day one
- Existing services can be refactored gradually, with a clear target
- We speak the same language about **events, state, and workflows**

---

### What You’ll Leave With

By the end, you should:

- **Know how to design an event** that:
  - Contains only data the emitting service owns
  - Uses clear, consistent types and correlation IDs
  - Plays nicely with retries and duplicates

- **Understand core patterns** and when to use them:
  - Event choreography vs orchestration vs aggregation
  - State tables vs event sourcing
  - When an **outbox** is worth the extra effort

- **Have a mental model** for:
  - How we want *our* event-driven systems to look
  - Where to put workflow logic
  - How to reason about state across multiple events

- **Leave with examples** (in TypeScript + AWS terms) you can drop into your services.

---

### Format & Logistics

- **Format:** Mix of short talks, whiteboard/diagramming, and practical design exercises
- **Tech context:** AWS, TypeScript, Lambdas, EventBridge, CloudEvents
- **Length:** ~2–3 hours
- **Where / When:**
  - Date: `TBD`
  - Time: `TBD`
  - Location: `TBD`

We’ll keep slides light and focus on **practical patterns and real examples**.

---

### Should You Come?
You should probably be there if:
- You own or contribute to a service that **emits or consumes events**
- You’ve ever thought "this Lambda is turning into a ball of mud"
- You’ve been bitten by **unexpected retries**, **duplicates**, or **race conditions**
- You want to help set **sensible standards** for how we use events

You might skip it if:
- You never touch backend systems or events at all
- You’re already deep into event sourcing and just want hardcore theory (this is practical and team-focused)

---

### How to Sign Up
- Check the calendar invite / event link (coming soon)
- If you’re unsure whether it’s for you, ask your tech lead or drop a note in the relevant engineering channel.

If you work with our event-driven systems, **your input matters**.  
Come along, bring your questions (and your worst event examples), and let’s make our events **boring, predictable, and reliable**—so our features can be the exciting part instead.
