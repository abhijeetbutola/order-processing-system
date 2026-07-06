# Phase 9 Test Plan

## Test 1 — Verify all workers start cleanly

Run `npm run dev` in the workers folder. You should see 5 workers starting up with no errors, each prefixed by `concurrently`. If any worker fails to start, it's likely an import path issue with the shared queues.

---

## Test 2 — End-to-end flow with a single order

Place one order via `POST /orders`. Then watch the terminals and verify:

1. `order.worker` logs `Orchestrating order: <id>`
2. `order.worker` logs `Order <id> orchestrated`
3. `email.worker` logs `Sending confirmation for order <id>`
4. `pdf.worker` logs `Generating invoice for order <id>`
5. `analytics.worker` logs `Updating analytics for order <id>`
6. `warehouse.worker` logs `Notifying warehouse for order <id>`

All 4 sub-workers should fire independently and in parallel.

---

## Test 3 — Bull Board shows all 5 queues

Open `http://localhost:3000/admin/queues`. You should see:

- `order-processing`
- `email-processing`
- `pdf-processing`
- `analytics-processing`
- `warehouse-processing`

After placing an order, jobs should show up in the completed tab of each sub-queue.

---

## Test 4 — Verify DB flags are being set

Open Prisma Studio (`npx prisma studio` in the prisma folder). After a successful order:

- `emailSentAt` — should be set
- `invoiceGeneratedAt` — should be set
- `analyticsUpdatedAt` — should be set
- `warehouseNotifiedAt` — should be set

---

## Test 5 — Worker isolation

Kill the `email.worker` (Ctrl+C in its terminal or stop that concurrently process). Place another order. Verify:

- `order.worker` still orchestrates successfully
- `pdf`, `analytics`, `warehouse` workers still complete
- The `email-processing` job sits in **Waiting** state in Bull Board (no consumer)
- Restart `email.worker` — it picks up the waiting job and processes it

This confirms workers are truly independent.

---

## Test 6 — Idempotency on retry

Place an order. Note the `orderId`. Then manually re-enqueue the same `send-confirmation` job with the same `orderId` (you can do this from Bull Board by duplicating a job). The email worker should log "Already sent, skipping..." instead of sending again.

---

Run these in order. Test 5 is the most important one for understanding the value of this architecture.
