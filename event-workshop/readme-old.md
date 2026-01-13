# Event-Driven Architecture Workshop
## Moving from Command-Driven to Event Choreography

### Workshop Overview
This workshop explores different patterns for event-driven architecture, focusing on how services should communicate through events while maintaining loose coupling and single responsibility principles.

---

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Event-Driven Patterns Comparison](#event-driven-patterns-comparison)
3. [Workshop Scenario: The Pizza Order System](#workshop-scenario)
4. [State Management Strategies](#state-management-strategies)
5. [Handling Edge Cases](#handling-edge-cases)
6. [Hands-On Activities](#hands-on-activities)
7. [Best Practices](#best-practices)

---

## Core Concepts

### What Are We Solving?
When moving from command-driven to event-driven architecture, we need to decide:
- **What data should events contain?**
- **Who is responsible for orchestrating multi-step workflows?**
- **How do we handle services that need data from multiple events?**

### The Key Principle
**Services should only emit events about their own domain and only include data they are responsible for.**

---

## Event-Driven Patterns Comparison

### Pattern 1: Event Orchestration (Central Orchestrator)
A central orchestrator service coordinates the workflow by listening to events and explicitly commanding the next steps.

```
┌─────────────┐
│ Orchestrator│◄─────────────┐
│   Service   │              │
└──┬──────┬───┘              │
   │      │                  │
   │      └─────────┐        │
   ▼                ▼        │
┌────────┐      ┌────────┐  │
│Service │      │Service │  │
│   A    │      │   B    │  │
└────────┘      └────────┘  │
   │                │        │
   └────────────────┴────────┘
```

**Pros:**
- ✅ Clear workflow visibility - easy to understand the entire process
- ✅ Simple debugging - one place to look for workflow logic
- ✅ Easy to implement timeouts and compensating transactions
- ✅ Good for complex business processes with many decision points

**Cons:**
- ❌ Single point of failure
- ❌ Orchestrator becomes a "god service" with too much knowledge
- ❌ Tight coupling - orchestrator must know about all services
- ❌ Harder to scale - orchestrator can become a bottleneck
- ❌ Changes to workflow require orchestrator updates

**When to Use:**
- Complex workflows with conditional logic
- Business processes requiring audit trails
- When you need saga pattern with compensations

---

### Pattern 2: Event Choreography (Distributed Events)
Services react to events independently. No central coordinator. Each service listens for events it cares about and emits events about its own work.

```
┌────────┐  Event A   ┌────────┐
│Service │───────────>│Service │
│   A    │            │   B    │
└────────┘            └───┬────┘
                          │ Event B
                          ▼
                      ┌────────┐
                      │Service │
                      │   C    │
                      └────────┘
```

**Pros:**
- ✅ Loose coupling - services don't know about each other
- ✅ Better scalability - no central bottleneck
- ✅ Easy to add new services without changing existing ones
- ✅ Services focus on their domain only (single responsibility)
- ✅ More resilient - no single point of failure

**Cons:**
- ❌ Harder to understand complete workflows
- ❌ Debugging distributed logic is challenging
- ❌ Need to manage event correlation and state
- ❌ Risk of event storms or circular dependencies
- ❌ Requires good monitoring and observability

**When to Use:**
- Simple, linear workflows
- When services should be highly independent
- When you expect frequent changes to the workflow
- Domain-driven design with clear bounded contexts

---

### Pattern 3: Hybrid (Event Aggregator)
An aggregator service collects events from multiple sources and emits a combined event when all pieces are ready. The aggregator doesn't orchestrate - it just correlates.

```
┌────────┐
│Service │───┐
│   A    │   │ Event A
└────────┘   │
             ▼
         ┌────────────┐
┌────────┤ Aggregator │
│Service │            │  Combined Event
│   B    │            ├───────────────────>
└────────┤            │
         └────────────┘
             ▲
┌────────┐   │ Event C
│Service │───┘
│   C    │
└────────┘
```

**Pros:**
- ✅ Separates correlation logic into one place
- ✅ Other services remain simple and focused
- ✅ Easy to handle timeouts and missing events
- ✅ Can be reused for different aggregation patterns

**Cons:**
- ❌ Additional service to maintain
- ❌ Still introduces some coupling (aggregator knows about multiple events)
- ❌ Can become complex if many aggregation patterns exist

**When to Use:**
- Multiple services produce data needed by one consumer
- Complex correlation logic (timeouts, partial matches)
- When you want to hide complexity from business services

---

### Pattern 4: Event Carrying State Transfer (Data Replication)
Events contain all necessary data. Services maintain local copies of data from other domains.

**Pros:**
- ✅ Services can work independently with local data
- ✅ Fast - no need to wait for or query other services
- ✅ Resilient to other service failures

**Cons:**
- ❌ Data duplication and eventual consistency
- ❌ Large event payloads
- ❌ Synchronization challenges
- ❌ Not suitable for sensitive data or frequently changing data

**When to Use:**
- Read-heavy operations
- When availability is more important than consistency
- Reference data that changes infrequently

---

## Workshop Scenario: The Pizza Order System

### The Story
A customer orders a custom pizza. Three independent services must complete their work before the pizza can be assembled:

1. **Payment Service** - Validates payment and processes transaction
2. **Inventory Service** - Checks and reserves ingredients
3. **Chef Service** - Validates the recipe and assigns a chef

Once all three have completed successfully, the **Kitchen Service** assembles and bakes the pizza.

### The Problem: Two Approaches

#### ❌ Anti-Pattern: Event Chain with Data Forwarding
```
Customer Order
     │
     ▼
┌──────────┐     Forwards: payment + inventory
│ Payment  ├────────────────────────────────┐
└──────────┘                                │
                                            ▼
                         ┌──────────┐   Forwards: payment + inventory + chef
                         │Inventory ├────────────────────────────────────┐
                         └──────────┘                                    │
                                                                         ▼
                                              ┌──────┐              ┌─────────┐
                                              │ Chef ├─────────────>│ Kitchen │
                                              └──────┘              └─────────┘
```

**Problems:**
- Payment service knows about inventory data
- Inventory service knows about payment and chef data
- Changes ripple through the chain
- Services are tightly coupled

#### ✅ Better Pattern: Event Choreography with Correlation
```
Customer Order (orderId: 12345)
     │
     ├────────────────┬─────────────────┬───────────────────┐
     ▼                ▼                 ▼                   ▼
┌──────────┐     ┌──────────┐     ┌──────┐          ┌─────────┐
│ Payment  │     │Inventory │     │ Chef │          │ Kitchen │
└────┬─────┘     └────┬─────┘     └───┬──┘          └────▲────┘
     │                │                │                  │
     │ Event A        │ Event B        │ Event C          │
     │ payment.       │ inventory.     │ chef.            │
     │ completed      │ reserved       │ assigned         │
     │                │                │                  │
     └────────────────┴────────────────┴──────────────────┘
                      Waits for all 3 events
```

**Benefits:**
- Each service emits only its own domain data
- Kitchen service correlates events by orderId
- Easy to add a 4th requirement (e.g., delivery service)
- Services are loosely coupled

---

## Event Payload Examples (CloudEvents)

### Initial Order Event
```json
{
  "specversion": "1.0",
  "type": "com.pizzaco.order.created",
  "source": "order-service",
  "id": "order-12345-evt-001",
  "time": "2026-01-13T10:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "orderId": "12345",
    "customerId": "cust-789",
    "pizzaType": "margherita",
    "toppings": ["extra-cheese", "olives"],
    "size": "large",
    "totalAmount": 15.99,
    "currency": "GBP"
  }
}
```

### Payment Completed Event
```json
{
  "specversion": "1.0",
  "type": "com.pizzaco.payment.completed",
  "source": "payment-service",
  "id": "payment-12345-evt-001",
  "time": "2026-01-13T10:00:15Z",
  "datacontenttype": "application/json",
  "data": {
    "orderId": "12345",
    "paymentId": "pay-xyz-789",
    "status": "approved",
    "amountCharged": 15.99,
    "currency": "GBP",
    "transactionId": "txn-001122"
  }
}
```

### Inventory Reserved Event
```json
{
  "specversion": "1.0",
  "type": "com.pizzaco.inventory.reserved",
  "source": "inventory-service",
  "id": "inventory-12345-evt-001",
  "time": "2026-01-13T10:00:18Z",
  "datacontenttype": "application/json",
  "data": {
    "orderId": "12345",
    "reservationId": "res-456",
    "ingredientsReserved": [
      { "ingredient": "dough-large", "quantity": 1 },
      { "ingredient": "cheese", "quantity": 200, "unit": "grams" },
      { "ingredient": "olives", "quantity": 50, "unit": "grams" }
    ],
    "expiresAt": "2026-01-13T10:30:00Z"
  }
}
```

### Chef Assigned Event
```json
{
  "specversion": "1.0",
  "type": "com.pizzaco.chef.assigned",
  "source": "chef-service",
  "id": "chef-12345-evt-001",
  "time": "2026-01-13T10:00:20Z",
  "datacontenttype": "application/json",
  "data": {
    "orderId": "12345",
    "chefId": "chef-mario",
    "chefName": "Mario Rossi",
    "estimatedPrepTime": 12,
    "specialtyMatch": true
  }
}
```

### Kitchen Ready Event (After All 3 Received)
```json
{
  "specversion": "1.0",
  "type": "com.pizzaco.kitchen.ready",
  "source": "kitchen-service",
  "id": "kitchen-12345-evt-001",
  "time": "2026-01-13T10:00:25Z",
  "datacontenttype": "application/json",
  "data": {
    "orderId": "12345",
    "status": "ready-for-preparation",
    "correlationData": {
      "paymentId": "pay-xyz-789",
      "reservationId": "res-456",
      "chefId": "chef-mario"
    }
  }
}
```

---

## State Management Strategies

When a service needs to wait for multiple events, it must track which events have been received. Here are common approaches:

### Strategy 1: Database State Table
Store received events in a database table, keyed by correlation ID.

**Example Schema:**
```typescript
interface OrderEventState {
  orderId: string;
  paymentCompleted: boolean;
  paymentData?: PaymentCompletedData;
  paymentReceivedAt?: Date;
  
  inventoryReserved: boolean;
  inventoryData?: InventoryReservedData;
  inventoryReceivedAt?: Date;
  
  chefAssigned: boolean;
  chefData?: ChefAssignedData;
  chefReceivedAt?: Date;
  
  status: 'waiting' | 'ready' | 'timeout' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

**Pros:**
- ✅ Durable - survives service restarts
- ✅ Queryable - can see current state
- ✅ Easy to implement timeouts

**Cons:**
- ❌ Database dependency
- ❌ Transaction complexity
- ❌ Potential bottleneck

---

### Strategy 2: In-Memory Cache (Redis/ElastiCache)
Store state in Redis with TTL for automatic cleanup.

```typescript
// Pseudo-code
const key = `order:${orderId}:events`;

// Store event
await redis.hset(key, 'payment', JSON.stringify(paymentEvent));
await redis.expire(key, 3600); // 1 hour TTL

// Check if all events received
const events = await redis.hgetall(key);
if (events.payment && events.inventory && events.chef) {
  // All events received!
  await processOrder(orderId, events);
  await redis.del(key); // Clean up
}
```

**Pros:**
- ✅ Fast
- ✅ Automatic expiry (TTL)
- ✅ Reduced database load

**Cons:**
- ❌ Not durable (can lose state on cache failure)
- ❌ Additional infrastructure

---

### Strategy 3: DynamoDB Streams / EventBridge Pipes
Use AWS-native event correlation capabilities.

**Pros:**
- ✅ Serverless and managed
- ✅ Scales automatically
- ✅ Integrated with AWS ecosystem

**Cons:**
- ❌ AWS-specific
- ❌ Learning curve
- ❌ Limited query capabilities

---

### Strategy 4: Event Sourcing
Store all events and rebuild state by replaying them.

**Pros:**
- ✅ Complete audit trail
- ✅ Can replay history
- ✅ Natural fit for event-driven systems

**Cons:**
- ❌ Complex to implement
- ❌ Query performance challenges
- ❌ Overkill for simple use cases

---

### Recommended Approach for AWS Lambda + TypeScript

**Use DynamoDB with TTL for state management:**

```typescript
// state-manager.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.STATE_TABLE_NAME!;
const TTL_HOURS = 24;

export interface OrderState {
  orderId: string;
  events: {
    payment?: PaymentEvent;
    inventory?: InventoryEvent;
    chef?: ChefEvent;
  };
  status: 'waiting' | 'ready' | 'processing' | 'timeout';
  ttl: number;
  createdAt: string;
  updatedAt: string;
}

export async function recordEvent(
  orderId: string,
  eventType: 'payment' | 'inventory' | 'chef',
  eventData: any
): Promise<OrderState> {
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + (TTL_HOURS * 3600);
  
  // Get existing state or create new
  const existing = await getOrderState(orderId);
  
  const state: OrderState = existing || {
    orderId,
    events: {},
    status: 'waiting',
    ttl,
    createdAt: now,
    updatedAt: now,
  };
  
  // Update with new event
  state.events[eventType] = eventData;
  state.updatedAt = now;
  
  // Check if all events received
  if (state.events.payment && state.events.inventory && state.events.chef) {
    state.status = 'ready';
  }
  
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: state,
  }));
  
  return state;
}

export async function getOrderState(orderId: string): Promise<OrderState | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { orderId },
  }));
  
  return result.Item as OrderState || null;
}

export function isReady(state: OrderState): boolean {
  return state.status === 'ready';
}
```

---

## Handling Edge Cases

### 1. Timeout - Not All Events Received

**Problem:** What if the chef service is down and never emits an event?

**Solutions:**

#### Option A: Time-based Timeout
Use DynamoDB Streams to trigger a Lambda when TTL expires:

```typescript
// timeout-handler.ts
export async function handleExpiredState(event: DynamoDBStreamEvent) {
  for (const record of event.Records) {
    if (record.eventName === 'REMOVE') {
      const state = record.dynamodb?.OldImage;
      const orderId = state?.orderId?.S;
      
      if (state && orderId) {
        // Check if incomplete
        const hasAllEvents = 
          state.events?.M?.payment &&
          state.events?.M?.inventory &&
          state.events?.M?.chef;
        
        if (!hasAllEvents) {
          // Emit timeout event
          await emitEvent({
            type: 'com.pizzaco.order.timeout',
            data: {
              orderId,
              receivedEvents: Object.keys(state.events?.M || {}),
              reason: 'not-all-events-received',
            },
          });
          
          // Trigger compensation (refund, release inventory, etc.)
          await compensateOrder(orderId, state);
        }
      }
    }
  }
}
```

#### Option B: EventBridge Scheduled Rule
Create a scheduled rule to check for stale orders:

```typescript
// scheduled-timeout-checker.ts
export async function checkTimeouts() {
  const now = Date.now();
  const timeoutThreshold = now - (30 * 60 * 1000); // 30 minutes
  
  // Scan for waiting orders older than threshold
  const staleOrders = await scanWaitingOrders(timeoutThreshold);
  
  for (const order of staleOrders) {
    await emitTimeoutEvent(order.orderId);
    await compensateOrder(order.orderId, order);
  }
}
```

---

### 2. Duplicate Events

**Problem:** EventBridge may deliver events more than once.

**Solution:** Make event handlers idempotent

```typescript
// Idempotent event handler
export async function handlePaymentEvent(event: CloudEvent) {
  const { orderId, paymentId } = event.data;
  
  // Check if already processed
  const existing = await getOrderState(orderId);
  if (existing?.events.payment?.paymentId === paymentId) {
    console.log(`Payment event ${paymentId} already processed, skipping`);
    return; // Idempotent - safe to ignore
  }
  
  // Process event
  await recordEvent(orderId, 'payment', event.data);
}
```

---

### 3. Events Arrive Out of Order

**Problem:** Inventory event arrives before payment event.

**Solution:** This is fine! Event choreography naturally handles this:

```typescript
// Each event handler just records its event
// Order doesn't matter - we check for completeness each time

export async function handleAnyEvent(eventType: string, eventData: any) {
  const state = await recordEvent(eventData.orderId, eventType, eventData);
  
  // Check if ready (works regardless of order)
  if (isReady(state)) {
    await processOrder(state);
  }
}
```

---

### 4. Failure Events

**Problem:** Payment failed or inventory not available.

**Solution:** Emit failure events and handle compensation

```json
{
  "specversion": "1.0",
  "type": "com.pizzaco.payment.failed",
  "source": "payment-service",
  "id": "payment-12345-fail-001",
  "time": "2026-01-13T10:00:15Z",
  "data": {
    "orderId": "12345",
    "reason": "insufficient-funds",
    "errorCode": "E001"
  }
}
```

```typescript
// Kitchen service listens for both success and failure events
export async function handlePaymentFailed(event: CloudEvent) {
  const { orderId, reason } = event.data;
  
  // Mark order as failed
  await updateOrderStatus(orderId, 'failed', reason);
  
  // Emit cancellation event
  await emitEvent({
    type: 'com.pizzaco.order.cancelled',
    data: { orderId, reason: `payment-failed: ${reason}` }
  });
}
```

---

### 5. Partial Success

**Problem:** Payment and inventory succeeded, but chef service failed.

**Solution:** Implement compensation/rollback

```typescript
export async function compensateOrder(orderId: string, state: OrderState) {
  const compensations = [];
  
  // Refund payment if it was completed
  if (state.events.payment) {
    compensations.push(
      emitEvent({
        type: 'com.pizzaco.payment.refund',
        data: {
          orderId,
          paymentId: state.events.payment.paymentId,
          reason: 'order-timeout',
        },
      })
    );
  }
  
  // Release inventory reservation
  if (state.events.inventory) {
    compensations.push(
      emitEvent({
        type: 'com.pizzaco.inventory.release',
        data: {
          orderId,
          reservationId: state.events.inventory.reservationId,
          reason: 'order-timeout',
        },
      })
    );
  }
  
  await Promise.all(compensations);
}
```

---

## Hands-On Activities

### Activity 1: Identify the Anti-Pattern (15 minutes)

**Scenario:** Review this event payload from a virus-scanning service:

```json
{
  "type": "com.fileservice.virus.scanned",
  "data": {
    "fileId": "file-123",
    "scanResult": "safe",
    "fileDescription": "User profile photo",
    "uploadedBy": "user-456",
    "s3Bucket": "my-bucket",
    "s3Key": "uploads/user-456/photo.jpg",
    "metadata": {
      "originalFilename": "vacation.jpg",
      "contentType": "image/jpeg"
    }
  }
}
```

**Questions:**
1. What data doesn't belong in this event?
2. Which service should own each piece of data?
3. How would you refactor this event?
4. What events should the "saver" service listen to?

**Discussion Points:**
- Single Responsibility: What is the virus scanner's job?
- Coupling: How does including metadata couple services?
- Change Impact: What happens if we add a new metadata field?

---

### Activity 2: Design Event Payloads (20 minutes)

**Scenario:** Design a system where a photo must pass through:
1. **Upload Service** - Receives photo from user
2. **Virus Scanner** - Checks for malware
3. **Image Processor** - Resizes and optimizes
4. **Metadata Extractor** - Reads EXIF data
5. **Storage Service** - Saves to S3 only when all 3 checks pass

**Task:** Design the CloudEvents for each service.

**Questions to Consider:**
- What correlation ID will you use?
- What data does each event contain?
- How does the storage service know when to proceed?

**Starter Template:**
```json
{
  "specversion": "1.0",
  "type": "com.photoapp.???",
  "source": "???-service",
  "data": {
    // What goes here?
  }
}
```

---

### Activity 3: Implement State Management (30 minutes)

**Task:** Implement a simple event correlator for the pizza scenario.

**Starting Code:**
```typescript
// kitchen-service/handler.ts
import { EventBridgeEvent } from 'aws-lambda';

// TODO: Implement state management
export async function handleEvent(event: EventBridgeEvent<string, any>) {
  const eventType = event['detail-type'];
  const orderId = event.detail.orderId;
  
  // TODO: Record this event
  
  // TODO: Check if all events received
  
  // TODO: If ready, process order
}
```

**Requirements:**
1. Track payment, inventory, and chef events
2. Process order when all 3 received
3. Handle duplicate events (idempotency)
4. Add timeout after 30 minutes

**Test Cases:**
- Events arrive in order
- Events arrive out of order
- Duplicate event received
- Only 2 of 3 events received (timeout)

---

### Activity 4: Handle Failures (20 minutes)

**Scenario:** The inventory service determines ingredients are not available.

**Task:** Design the failure handling:
1. What event does inventory service emit?
2. What should payment service do?
3. What should customer service do?
4. How do you prevent chef service from being assigned?

**Bonus:** What if inventory was available initially but reservation expires before chef is assigned?

---

### Activity 5: Pattern Selection (15 minutes)

For each scenario, choose the best pattern and justify:

| Scenario | Best Pattern? | Why? |
|----------|---------------|------|
| Simple 3-step process: upload → scan → save | | |
| Complex loan application with 15 steps and conditional logic | | |
| User profile updates that need to be reflected in 5 different services | | |
| Medical prescription requiring doctor approval, insurance check, and pharmacy availability | | |
| E-commerce checkout with payment, inventory, shipping | | |

**Patterns:**
- A) Event Orchestration
- B) Event Choreography
- C) Event Aggregator
- D) Event-Carrying State Transfer

---

## Best Practices

### 1. Event Design Principles

✅ **DO:**
- Use correlation IDs (orderId, requestId, etc.)
- Include timestamps
- Use semantic event types (`order.created`, not `order.event`)
- Follow CloudEvents specification
- Version your event schemas
- Make events immutable
- Include only data the service owns

❌ **DON'T:**
- Include data from other domains
- Use events as RPC calls
- Create circular event dependencies
- Put sensitive data in events without encryption
- Make events too large (>256KB)

---

### 2. Service Boundaries

**Good Example:**
```
Payment Service emits:
- payment.initiated
- payment.completed
- payment.failed
- payment.refunded

Payment Service does NOT emit:
- inventory.reserved (that's inventory service's job)
- order.completed (that's order service's job)
```

---

### 3. Correlation ID Strategy

Use hierarchical correlation IDs:
```
orderId: 12345                          (Business ID)
├─ payment: pay-12345-001              (Service transaction ID)
├─ inventory: inv-12345-001            (Service transaction ID)
└─ chef: chef-12345-001                (Service transaction ID)
```

This allows:
- Distributed tracing
- Debugging across services
- Audit trails

---

### 4. Monitoring and Observability

**Essential Metrics:**
- Event processing latency per service
- Number of incomplete order states (waiting)
- Timeout rate
- Event processing failures
- Average time to all-events-received

**Dashboards:**
- Funnel view: How many orders at each stage?
- Bottleneck detection: Which service is slowest?
- Correlation completion rate

**Example CloudWatch Insight Query:**
```
fields @timestamp, orderId, status, eventType
| filter status = "waiting"
| stats count() by orderId
| filter count > 60  # Waiting for more than 60 events = stuck
```

---

### 5. Testing Strategies

#### Unit Tests
Test individual event handlers:
```typescript
describe('handlePaymentEvent', () => {
  it('should record payment event', async () => {
    const event = createPaymentEvent({ orderId: '123' });
    await handlePaymentEvent(event);
    
    const state = await getOrderState('123');
    expect(state.events.payment).toBeDefined();
  });
  
  it('should be idempotent', async () => {
    const event = createPaymentEvent({ orderId: '123', paymentId: 'pay-1' });
    await handlePaymentEvent(event);
    await handlePaymentEvent(event); // Second time
    
    // Should only have one payment event recorded
    const state = await getOrderState('123');
    expect(state.events.payment.paymentId).toBe('pay-1');
  });
});
```

#### Integration Tests
Test event correlation:
```typescript
describe('order correlation', () => {
  it('should process order when all events received', async () => {
    const orderId = '123';
    
    await handlePaymentEvent({ orderId, paymentId: 'pay-1' });
    await handleInventoryEvent({ orderId, reservationId: 'res-1' });
    await handleChefEvent({ orderId, chefId: 'chef-1' });
    
    // Should trigger processing
    const state = await getOrderState(orderId);
    expect(state.status).toBe('ready');
  });
  
  it('should handle out-of-order events', async () => {
    const orderId = '456';
    
    // Events arrive in reverse order
    await handleChefEvent({ orderId, chefId: 'chef-1' });
    await handleInventoryEvent({ orderId, reservationId: 'res-1' });
    await handlePaymentEvent({ orderId, paymentId: 'pay-1' });
    
    const state = await getOrderState(orderId);
    expect(state.status).toBe('ready');
  });
});
```

#### Chaos Testing
- What if a service is down?
- What if events are delayed by 10 minutes?
- What if EventBridge duplicates events?

---

## Summary: When to Use Each Pattern

### Use **Event Choreography** when:
- Services have clear domain boundaries
- Workflow is relatively simple or linear
- You value loose coupling and scalability
- Teams are autonomous and own their services
- **This is your default choice for most scenarios**

### Use **Event Orchestration** when:
- Complex business logic with many conditionals
- Need strong consistency guarantees
- Require detailed audit trails and workflow visibility
- Compensation and rollback are critical
- Few services involved (< 5)

### Use **Event Aggregator** when:
- One service needs data from multiple events
- Complex correlation logic
- Want to hide complexity from business services
- Multiple consumers need the aggregated result

### Use **Event-Carrying State Transfer** when:
- Read-heavy operations
- Reference data
- Services need to work independently
- Availability > Consistency

---

## Additional Resources

### Tools for AWS + TypeScript
- **EventBridge:** Message bus for events
- **DynamoDB:** State storage with TTL
- **DynamoDB Streams:** Trigger actions on state changes
- **Lambda:** Event handlers
- **X-Ray:** Distributed tracing
- **CloudWatch:** Monitoring and dashboards

### Recommended Reading
- "Building Event-Driven Microservices" by Adam Bellemare
- "Enterprise Integration Patterns" by Gregor Hohpe
- AWS Well-Architected Framework: Event-Driven Architecture

### Example Repository Structure
```
event-driven-pizza/
├── services/
│   ├── payment-service/
│   │   ├── handler.ts
│   │   └── events.ts
│   ├── inventory-service/
│   ├── chef-service/
│   └── kitchen-service/
│       ├── handler.ts
│       ├── state-manager.ts
│       └── correlation.ts
├── shared/
│   ├── types/
│   │   └── events.ts
│   └── utils/
│       └── event-emitter.ts
└── infrastructure/
    └── eventbridge.yml
```

---

## Workshop Wrap-Up Discussion Questions

1. **How would you refactor your current event-driven services?**
   - What data are you passing that you shouldn't?
   - Which services have too much knowledge of other domains?

2. **What challenges do you anticipate?**
   - Team boundaries and ownership?
   - Monitoring and debugging?
   - Testing strategies?

3. **What's your action plan?**
   - Start with new services or refactor existing?
   - What pattern makes sense for each use case?
   - How will you measure success?

---

## Appendix: Quick Reference

### Event Checklist
- [ ] Uses CloudEvents specification
- [ ] Has unique event ID
- [ ] Has correlation ID (orderId, requestId, etc.)
- [ ] Event type is semantic (`domain.entity.action`)
- [ ] Contains only data the service owns
- [ ] Includes timestamp
- [ ] Is immutable
- [ ] Size < 256KB

### State Management Checklist
- [ ] Correlation ID strategy defined
- [ ] State storage chosen (DynamoDB, Redis, etc.)
- [ ] TTL/cleanup strategy implemented
- [ ] Timeout handling defined
- [ ] Idempotency handled
- [ ] Monitoring in place

### Failure Handling Checklist
- [ ] Timeout duration defined
- [ ] Compensation logic implemented
- [ ] Failure events defined
- [ ] Dead letter queue configured
- [ ] Alerting configured
- [ ] Runbook created for operational support
