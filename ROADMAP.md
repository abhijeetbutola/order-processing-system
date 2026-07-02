# Order Processing System — Learning Roadmap

Track your progress through each phase. Check off items as you complete them.

---

## Phase 1: Realistic Worker
Refactor the worker to simulate multiple independent tasks per order.

- [ ] Simulate sending a confirmation email (delay + log)
- [ ] Simulate generating an invoice (delay + log)
- [ ] Simulate updating analytics (delay + log)
- [ ] Simulate notifying the warehouse (delay + log)

> Goal: understand that a single job often represents a multi-step workflow.

---

## Phase 2: Introduce Failures + Retries
Make jobs fail randomly and configure BullMQ to handle it.

- [ ] Add random failure (`Math.random() < 0.3`) in one of the simulated tasks
- [ ] Configure 3 retries on the queue/worker
- [ ] Configure exponential backoff
- [ ] Observe retry behaviour in logs

> Goal: understand why retries are a core feature of queue systems.

---

## Phase 3: Bull Board (Visual Dashboard)
Install Bull Board to inspect jobs visually.

- [ ] Install `@bull-board/api` and `@bull-board/express`
- [ ] Mount the dashboard on a route (e.g. `/admin/queues`)
- [ ] Observe waiting, active, completed, failed, and retried jobs

> Goal: make queue state visible and easier to reason about.

---

## Phase 4: Multiple Worker Processes
Run several worker processes simultaneously and observe load sharing.

- [ ] Run `npm run worker` in 3 separate terminals
- [ ] Create 50 orders via the API
- [ ] Observe jobs distributed across Worker 1, 2, and 3

> Goal: first exposure to horizontal scaling.

---

## Phase 5: Priority Jobs
Give VIP orders higher priority so they skip the queue.

- [ ] Add a `priority` field to the order (e.g. `vip: boolean`)
- [ ] Pass priority when enqueuing the job
- [ ] Create a normal order and a VIP order, observe processing order

> Goal: understand scheduling beyond simple FIFO.

---

## Phase 6: Delayed Jobs
Schedule a job to run after a delay (e.g. a follow-up email after 30 minutes).

- [ ] Enqueue a "payment reminder" job with a `delay` option
- [ ] Observe the job sitting in the waiting state until the delay passes

> Goal: understand time-based job scheduling.

---

## Phase 7: Job Progress Reporting
Report fine-grained progress from inside the worker.

- [ ] Call `job.updateProgress()` at each stage (10%, 40%, 70%, 100%)
- [ ] Add a `GET /orders/:id/progress` endpoint that reads job progress
- [ ] Test polling progress from a client

> Goal: understand how background jobs can communicate state back to the frontend.

---

## Phase 8: Idempotency
Ensure jobs are safe to retry without causing duplicate side effects.

- [ ] Identify which tasks are non-idempotent (e.g. sending an email twice)
- [ ] Add a deduplication check (e.g. store a `emailSentAt` flag on the order)
- [ ] Verify that retrying a job does not send duplicate emails or double-charge

> Goal: understand why background jobs must be idempotent.

---

## Phase 9: Split into Multiple Queues + Dead Letter Queues
Turn the order worker into an orchestrator that fans out to specialised queues.

- [ ] Create `email-queue`
- [ ] Create `pdf-queue`
- [ ] Create `analytics-queue`
- [ ] Create `warehouse-queue`
- [ ] Refactor `order.worker.ts` to enqueue jobs onto each sub-queue
- [ ] Create a dedicated worker for each sub-queue
- [ ] Configure a dead letter queue for jobs that exhaust all retries
- [ ] Inspect dead-lettered jobs in Bull Board

> Goal: understand queue fan-out and the beginnings of a microservice architecture.

---

## Phase 10: Throughput Experiment
Stress-test the system and start thinking like a backend engineer.

- [ ] Write a script to generate 1000 orders
- [ ] Measure API response time under load
- [ ] Observe queue size growth and drain rate
- [ ] Measure per-worker throughput (jobs/second)
- [ ] Experiment with concurrency settings on the worker

> Goal: develop intuition for system capacity and bottlenecks.

---

## After Phase 10: RabbitMQ

Once you've completed the above, you'll naturally ask:

> "What if my email worker, analytics worker, and inventory worker were **different services** instead of just different queues?"

That's exactly the problem RabbitMQ solves. At that point it won't feel like a new technology — it'll feel like the next logical step.

---

## Current Status

- [x] `POST /orders` endpoint
- [x] BullMQ queue + Redis connection
- [x] Order worker (basic — receive job, update DB status)
- [x] Prisma v5 integration in API and workers
- [x] TypeScript in both `api/` and `workers/`
- [ ] Phase 1 — Realistic worker
