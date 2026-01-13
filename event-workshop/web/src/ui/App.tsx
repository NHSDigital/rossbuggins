import React, { useEffect, useMemo, useRef, useState } from "react";
import { actions, startSession, getEventsForSubject, getKitchenStateForOrder, PizzaChoice, SessionState } from "../engine";

const PIZZAS: PizzaChoice[] = [
  { name: "margherita", price: 9.99 },
  { name: "pepperoni", price: 11.99 },
  { name: "veggie", price: 10.99 },
];

export const App: React.FC = () => {
  const [name, setName] = useState("");
  const [pizza, setPizza] = useState<PizzaChoice>(PIZZAS[0]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [freezeAt, setFreezeAt] = useState<number | null>(null);
  const bannerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      setNow((prev) => prev + 250);
    }, 250);
    return () => clearInterval(id);
  }, [session]);

  const events = session ? getEventsForSubject(session) : [];
  const kitchenState = session ? getKitchenStateForOrder(session) : null;

  const terminalStatus = kitchenState && kitchenState.status !== "waiting"
    ? kitchenState.status
    : null;

  useEffect(() => {
    if (!session) return;
    if (!terminalStatus) {
      setFreezeAt(null);
      return;
    }
    // Freeze at the moment we first see a terminal state
    setFreezeAt((prev) => (prev ?? now));
  }, [session, terminalStatus, now]);

  const effectiveNow = freezeAt ?? now;

  const remaining = useMemo(() => {
    if (!session) return 0;
    return Math.max(session.timeoutMs - (effectiveNow - session.start), 0);
  }, [session, effectiveNow]);

  const elapsed = useMemo(() => {
    if (!session) return 0;
    return Math.max(effectiveNow - session.start, 0);
  }, [session, effectiveNow]);

  const fractionRemaining = useMemo(() => {
    if (!session || session.timeoutMs === 0) return 0;
    const frac = remaining / session.timeoutMs;
    return Math.min(Math.max(frac, 0), 1);
  }, [session, remaining]);

  useEffect(() => {
    if (!terminalStatus) return;
    // Scroll the banner into view when a terminal state is reached
    bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [terminalStatus]);

  const handleStart = () => {
    const trimmed = name.trim() || "guest";
    const s = startSession(trimmed, pizza);
    setSession(s);
    setLastAction("Started session");
  };

  const disabled = !session || !!terminalStatus;

  return (
    <div className="app-root">
      <h1>Event Workshop Web Demo</h1>

      {session && terminalStatus && (
        <section
          ref={bannerRef}
          className={
            "status-banner " +
            (terminalStatus === "ready"
              ? "status-ready"
              : terminalStatus === "timeout"
              ? "status-timeout"
              : "status-failed")
          }
        >
          {terminalStatus === "ready" && (
            <>
              <h2>🎉 Order is READY!</h2>
              <p>All events arrived in time. The kitchen is happy.</p>
            </>
          )}
          {terminalStatus === "failed" && (
            <>
              <h2>⚠️ Order FAILED</h2>
              <p>Something went wrong (payment, inventory, or chef).</p>
            </>
          )}
          {terminalStatus === "timeout" && (
            <>
              <h2>⏰ Order TIMED OUT</h2>
              <p>Not all events arrived before the deadline.</p>
            </>
          )}
        </section>
      )}

      {!session && (
        <section className="card">
          <h2>Start a new order</h2>
          <label>
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ross"
            />
          </label>

          <label>
            Pizza
            <select
              value={pizza.name}
              onChange={(e) => {
                const choice = PIZZAS.find((p) => p.name === e.target.value) ?? PIZZAS[0];
                setPizza(choice);
              }}
            >
              {PIZZAS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} (£{p.price.toFixed(2)})
                </option>
              ))}
            </select>
          </label>

          <button onClick={handleStart}>Place order</button>
        </section>
      )}

      {session && (
        <>
          <section className="card">
            <h2>Session</h2>
            <p>
              <strong>Customer:</strong> {session.customerId}
            </p>
            <p>
              <strong>Order ID:</strong> {session.orderId}
            </p>
            <p>
              <strong>Clock:</strong> t={(elapsed / 1000).toFixed(1)}s,
              remaining={(remaining / 1000).toFixed(1)}s
            </p>
            <div className="clock-bar">
              <div
                className={
                  "clock-bar-inner " +
                  (fractionRemaining > 0.5
                    ? "clock-ok"
                    : fractionRemaining > 0.2
                    ? "clock-warn"
                    : "clock-danger")
                }
                style={{ width: `${fractionRemaining * 100}%` }}
              />
            </div>
            {lastAction && (
              <p>
                <strong>Last action:</strong> {lastAction}
              </p>
            )}
          </section>

          <section className="card">
            <h2>Actions</h2>
            <div className="actions-grid">
              <button disabled={disabled} onClick={() => { actions.paymentSuccess(session); setLastAction("Payment success"); }}>Payment success</button>
              <button disabled={disabled} onClick={() => { actions.paymentFailure(session); setLastAction("Payment failure"); }}>Payment failure</button>
              <button disabled={disabled} onClick={() => { actions.inventoryReserved(session); setLastAction("Inventory reserved"); }}>Inventory reserved</button>
              <button disabled={disabled} onClick={() => { actions.inventoryFailed(session); setLastAction("Inventory failed"); }}>Inventory failed</button>
              <button disabled={disabled} onClick={() => { actions.chefAssigned(session); setLastAction("Chef assigned"); }}>Chef assigned</button>
              <button disabled={disabled} onClick={() => { actions.chefUnavailable(session); setLastAction("Chef unavailable"); }}>Chef unavailable</button>
            </div>
          </section>

          <section className="card">
            <h2>Kitchen state</h2>
            <pre className="code-block">
{JSON.stringify(kitchenState, null, 2)}
            </pre>
          </section>

          <section className="card">
            <h2>Events for this order</h2>
            <pre className="code-block">
{JSON.stringify(events, null, 2)}
            </pre>
          </section>
        </>
      )}
    </div>
  );
};
