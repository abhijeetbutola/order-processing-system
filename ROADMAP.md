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
- [x] Phase 1 — Realistic worker
- [x] Phase 2 — Failures + Retries
- [x] Phase 3 — Bull Board
- [x] Phase 4 — Multiple Worker Processes
- [x] Phase 5 — Priority Jobs
- [x] Phase 6 — Delayed Jobs
- [x] Phase 7 — Job Progress Reporting
- [x] Phase 8 — Idempotency
- [x] Phase 9 — Multiple Queues + Dead Letter Queues
- [x] Phase 10 — Throughput Experiment
- [ ] Phase 11 — RabbitMQ Migration (see below)

---

# Part 2: RabbitMQ

> Create a new git branch before starting: `git checkout -b rabbitmq`
>
> You are migrating the same order processing system from BullMQ/Redis to RabbitMQ.
> The domain stays the same — only the messaging layer changes.

**Key mindset shift:** BullMQ is a job queue (tasks to be done). RabbitMQ is a message broker (events that happened). Workers become independent services that react to events.

**Node.js library:** `amqplib` (low-level) or `amqp-connection-manager` (recommended — handles reconnects automatically).

---

## Phase 11: Install RabbitMQ + Explore the Management UI

Get RabbitMQ running and get familiar with its concepts visually before writing any code.

- [ ] Run RabbitMQ via Docker:
  ```
  docker run -d \
    --hostname rabbitmq \
    --name rabbitmq \
    -p 5672:5672 \
    -p 15672:15672 \
    rabbitmq:3-management
  ```
- [ ] Open the management UI at `http://localhost:15672` (guest / guest)
- [ ] Explore the **Exchanges**, **Queues**, and **Connections** tabs (they'll be empty — that's fine)
- [ ] Install `amqplib` and `@types/amqplib` in the project
- [ ] Write a minimal publisher script that connects to RabbitMQ and publishes one message to the default exchange
- [ ] Write a minimal consumer script that reads and logs that message

> Goal: understand the basic publish/consume cycle. Notice you must explicitly **acknowledge** (ack) a message — RabbitMQ will redeliver it if you don't. BullMQ handled this automatically.

---

## Phase 12: One Exchange → One Queue → One Consumer

Replicate the simplest version of your order flow in RabbitMQ.

- [ ] Create a `direct` exchange named `orders`
- [ ] Create a queue named `order-processing` and bind it to the exchange with routing key `order.created`
- [ ] When `POST /orders` is called, publish a message to the `orders` exchange with routing key `order.created`
- [ ] Create a consumer that reads from `order-processing` and logs the order details
- [ ] Confirm the message appears and disappears in the RabbitMQ UI when consumed

> Goal: this will look almost identical to your BullMQ setup. That's intentional — feel the similarity before the differences emerge.

---

## Phase 13: Fan-Out to Multiple Services

Add more queues so one published event reaches multiple independent consumers.

- [ ] Create an `inventory` queue bound to `orders` exchange with routing key `order.created`
- [ ] Create a consumer (inventory service) that processes inventory updates
- [ ] Add an `email` queue bound to the same exchange with the same routing key
- [ ] Create a consumer (email service) that sends confirmation emails
- [ ] Publish one order and observe **both consumers** receiving and processing it independently

> Goal: this is the "aha moment" — one publish, two services react, zero code change in the order publisher. This is why RabbitMQ exists.

---

## Phase 14: Complete Fan-Out (All Sub-Services)

Mirror the full architecture you built in Phase 9, now using RabbitMQ.

- [ ] Add `analytics` queue and consumer
- [ ] Add `warehouse` queue and consumer
- [ ] Add `notification` queue and consumer (for payment reminders)
- [ ] Verify all 5 consumers receive the event when an order is created
- [ ] Confirm each service processes independently without blocking the others

> Goal: your Phase 9 architecture, rebuilt on RabbitMQ. Notice there is no orchestrator worker anymore — the exchange handles fan-out natively.

---

## Phase 15: Durability and Decoupling

Understand what happens when a service goes down.

- [ ] Stop one consumer (e.g. the notification service)
- [ ] Create several orders while it is down
- [ ] Bring the consumer back up
- [ ] Observe it processing the queued messages that accumulated while it was offline
- [ ] Mark queues and messages as **durable** so they survive a RabbitMQ restart
- [ ] Restart RabbitMQ and verify messages were not lost

> Goal: understand why decoupling is a superpower. The order service didn't care that notification was down. Messages waited. This is not possible with a direct HTTP call.

---

## Phase 16: Exchange Types — RabbitMQ's Routing Superpower

Learn how RabbitMQ routes messages differently based on exchange type.

- [ ] **Direct Exchange** — route by exact routing key (you've been using this)
- [ ] **Fanout Exchange** — broadcast to all bound queues, ignoring routing keys entirely
  - Use case: broadcast `order.created` to every service without listing them
- [ ] **Topic Exchange** — route by pattern matching on routing keys
  - Example: `order.*` matches `order.created` and `order.cancelled`
  - Example: `#.failed` matches `order.failed`, `payment.failed`, `email.failed`
  - Use case: fine-grained event routing — a monitoring service subscribes to `*.failed`
- [ ] Refactor your exchange to use **Topic** with routing keys like `order.created`, `order.cancelled`, `order.failed`
- [ ] Add a dead letter consumer that subscribes to `#.failed`

> Goal: Topic Exchange is the most powerful and most commonly used in production. Understanding routing keys makes RabbitMQ feel like a programmable message router.

---

## Phase 17: Retries and Dead Letter Queues in RabbitMQ

RabbitMQ has no built-in retry mechanism like BullMQ. You implement it yourself using DLX (Dead Letter Exchange).

- [ ] Create a dead letter exchange (`dlx`) and a dead letter queue (`failed-jobs`)
- [ ] Configure a queue to forward rejected/expired messages to the DLX
- [ ] In a consumer, `nack` a message (negative acknowledge) without requeue to trigger dead-lettering
- [ ] Observe the message appear in the `failed-jobs` queue
- [ ] Implement a retry pattern: use message `headers` to track attempt count, requeue with a delay up to N times before dead-lettering

> Goal: understand the tradeoff — BullMQ gives you retries and backoff for free. RabbitMQ gives you flexibility to implement exactly the retry logic your use case needs.

---

## Phase 18: Deployment

Containerize the full system and deploy it. This is where everything becomes real.

### Docker
- [x] Write a `Dockerfile` for the API service
- [x] Write a `Dockerfile` for workers (one image, one compose service per worker)
- [x] Update `docker-compose.yml` to run all services together (API, all workers, PostgreSQL, Redis, RabbitMQ)
- [x] Automate DB schema with a one-shot `migrate` service (`prisma migrate deploy`) that runs before API/workers start
- [x] Run the full system with a single `docker compose up --build`
- [x] Smoke-test: create an order via curl and confirm workers process it end-to-end

### Kubernetes
- [x] Learn the basics: pods, deployments, services, replica sets
- [x] Write a Kubernetes deployment manifest for one service (start with API)
- [x] Scale a worker horizontally with `kubectl scale`
- [x] Add worker Deployments (session 3) and Secret-backed credentials

### CI/CD — GitHub Actions deploy pipeline
Automate build + migrate + image publish on merge to `main` (Option B: migrate in the pipeline, not only at container start).

- [x] Create `.github/workflows/ci.yml`
- [x] Trigger on push/PR to `main` and `deployment`
- [x] Job 1 — **CI checks** (checkout, Node 20, install api/workers/prisma, prisma generate)
- [ ] Job 1 extras — lint/typecheck/tests (Phase 21)
- [x] Job 2 — **Build Docker images** (API + workers, Buildx + GHA cache)
- [x] Job 3 — **Migrate (Option B)** against ephemeral CI Postgres via `prisma migrate deploy`
  - [ ] Add Actions **variable** `ENABLE_CI_MIGRATE=true` (job gate — secrets cannot be used in `if:`)
  - [ ] Add Actions **secret** `CI_POSTGRES_PASSWORD` (password for the ephemeral CI Postgres)
- [x] Job 4 — **Push images to GHCR** on push (`ghcr.io/<owner>/order-api` and `order-workers`)
- [ ] Job 5 — **Deploy** (`kubectl set image` / cloud roll-out) — later

> Setup (Actions):
> 1. Settings → Secrets and variables → Actions → **Variables** → `ENABLE_CI_MIGRATE` = `true`
> 2. Settings → Secrets and variables → Actions → **Secrets** → `CI_POSTGRES_PASSWORD` = any throwaway password  
> Packages: after first push, make GHCR packages public or grant pull access for your cluster.

> Goal: "I built it" becomes "I shipped it". Pipeline story for interviews: build → migrate once → push images → deploy. This is the single highest-leverage thing you can add to your profile for the 25-30 LPA bracket.

---

## Phase 19: Observability
Make the system's health visible. You can't run something in production if you can't tell whether it's working.

**Structured Logging**
- [ ] Replace all `console.log` calls with a structured logger (`pino` recommended — fast, JSON output)
- [ ] Ensure every log line includes `orderId`, `workerId`, `timestamp`, and `level` (info/warn/error)
- [ ] Understand why plain `console.log` is not enough in production (no log levels, no queryable fields)

**Metrics with Prometheus + Grafana**
- [ ] Add `prom-client` to the API and workers
- [ ] Expose a `GET /metrics` endpoint on the API
- [ ] Track these metrics: orders created per second, queue consumer lag, worker error rate, job processing duration
- [ ] Run Prometheus via Docker and point it at your `/metrics` endpoint
- [ ] Run Grafana via Docker, connect it to Prometheus, and build a simple dashboard
- [ ] Add Prometheus and Grafana to `docker-compose.yml`

**Tracing (Optional but impressive)**
- [ ] Learn what distributed tracing is — following a single request across API → RabbitMQ → email service → DB
- [ ] Add OpenTelemetry SDK to the API
- [ ] Propagate a `traceId` through message headers so all consumers log the same ID for a given order
- [ ] Even without a full tracing backend, consistent `traceId` in logs is already a production pattern

> Goal: answer "is the system healthy?" with data, not guesses. In interviews, being able to say "I instrumented my services with Prometheus and built dashboards in Grafana" is a strong differentiator at the senior level.

---

## Phase 20: Resiliency Patterns
Production systems fail. These patterns are how you design for failure instead of being surprised by it.

**Rate Limiting**
- [ ] Add `express-rate-limit` to the API
- [ ] Apply a limit to `POST /orders` (e.g. 100 requests per minute per IP)
- [ ] Return a `429 Too Many Requests` response when the limit is exceeded
- [ ] Understand why this protects both your API and your queue from being overwhelmed

**Circuit Breakers**
- [ ] Install `opossum` (standard Node.js circuit breaker library)
- [ ] Wrap your RabbitMQ publish call in a circuit breaker
- [ ] Configure: open after 5 failures, try again after 30 seconds
- [ ] Simulate RabbitMQ being down — observe the circuit breaker open and the API returning a graceful error instead of hanging
- [ ] Understand the three states: Closed (normal), Open (failing fast), Half-Open (testing recovery)

> Goal: understand that resilient systems don't just retry — they stop trying when a dependency is down, fail fast, and recover gracefully. This is a pattern that comes up in every senior backend interview.

---

## Phase 21: Testing
A project with no tests is not production-ready. This phase adds confidence that your system works as intended.

**Unit Tests**
- [ ] Install `jest` and `ts-jest`
- [ ] Write unit tests for pure logic functions (e.g. `checkOrderCompletion`)
- [ ] Mock Prisma client using `jest-mock-extended` or manual mocks

**Integration Tests**
- [ ] Install `supertest`
- [ ] Write integration tests for `POST /orders` — assert status code, response shape, and that a job was enqueued
- [ ] Write a test for `GET /orders/job/:jobId/progress`
- [ ] Use an in-memory Redis or a test Redis instance for queue assertions

**What to test in worker logic**
- [ ] Test that idempotency checks prevent duplicate processing (call the worker twice with the same order, assert side effects happen once)
- [ ] Test that the dead letter queue receives a job after all retries are exhausted

> Goal: be able to say "my services have integration test coverage" in an interview. Also: tests will catch bugs during the RabbitMQ migration before you spend an hour debugging.

---

## Phase 22: Real-Time Progress (SSE)
Replace polling with server-sent events for a cleaner, more production-realistic progress experience.

- [ ] Understand the difference between polling, SSE, and WebSockets:
  - Polling: client asks repeatedly "are you done yet?"
  - SSE: server pushes updates to the client over a persistent HTTP connection (one-way)
  - WebSockets: full duplex, both sides can send at any time
- [ ] Replace `GET /orders/job/:jobId/progress` polling with a `GET /orders/job/:jobId/stream` SSE endpoint
- [ ] From the worker, publish progress events to a Redis pub/sub channel
- [ ] The SSE endpoint subscribes to that channel and streams updates to the client in real time
- [ ] Build a minimal HTML page that connects to the SSE stream and shows live progress

> Goal: understand that polling is a smell in production UIs. SSE is the right tool for unidirectional server-to-client updates like job progress, notifications, and live feeds.

---

## Concepts to Know (No Code Required)
These are patterns and vocabulary you should be able to discuss in interviews. You've already implemented versions of them — knowing the names makes you sound senior.

| Concept | What it is | Where you built it |
|---|---|---|
| **SAGA Pattern** | Managing distributed transactions across services with compensating actions on failure | Your order flow: email + pdf + analytics + warehouse must all complete; partial failure triggers status update |
| **Eventual Consistency** | The system will be consistent, but not immediately — all services will process the event eventually | Your order status becomes COMPLETED only after all 4 sub-workers finish |
| **Idempotency** | An operation that can be safely repeated without changing the result beyond the first execution | Your `emailSentAt` / `invoiceGeneratedAt` flags |
| **Fan-Out** | One event triggers multiple independent downstream consumers | Your orchestrator enqueuing to 4 sub-queues |
| **Dead Letter Queue** | A queue that captures messages that could not be processed after all retries | Your `dead-letter` queue |
| **Circuit Breaker** | Stops calling a failing dependency and fails fast until it recovers | Phase 20 |
| **Backpressure** | Slowing down producers when consumers can't keep up | Worker concurrency limits in Phase 10 |

---

## When to Use What

| | BullMQ | RabbitMQ | Kafka |
|---|---|---|---|
| **Best for** | Background jobs, task queues | Service-to-service messaging | High-throughput event streaming |
| **Mental model** | Task to be done | Event that happened | Ordered event log |
| **Retries** | Built-in | Manual (DLX pattern) | Manual |
| **Scaling** | Worker concurrency | Multiple consumers per queue | Consumer groups + partitions |
| **When to reach for it** | Cron jobs, emails, PDF generation | Microservices communicating | Analytics pipelines, audit logs, 100k+ events/sec |
