# Order Processing System

A learning project to deeply understand asynchronous distributed systems — built incrementally from a basic job queue to a full microservice-style message broker architecture.

## What this project covers

- Async job processing with BullMQ + Redis (see `bullmq` branch)
- Fan-out architecture with RabbitMQ exchanges and multiple independent consumers (active on `main`)
- Worker patterns: retries, exponential backoff, idempotency, dead letter queues, priority jobs
- Orchestrator → sub-worker fan-out pattern
- Load testing and throughput measurement
- Deployment, observability, and resiliency (in progress)

## Branches

| Branch | Description |
|---|---|
| `main` | Latest stable state — updated as phases complete |
| `rabbitmq` | Active development — RabbitMQ migration |
| `bullmq` | Frozen snapshot of the completed BullMQ implementation |

---

## Architecture

### BullMQ (completed — `bullmq` branch)

```
Client → API (Express)
              ├── PostgreSQL (persist order)
              └── Redis/BullMQ (enqueue job)
                        │
                        ▼
              Orchestrator Worker
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼             ▼
    Email Worker   PDF Worker  Analytics Worker  Warehouse Worker
                                                       │
                                               (all done?) → COMPLETED
```

### RabbitMQ (in progress — `rabbitmq` branch)

```
Client → API (Express)
              ├── PostgreSQL (persist order)
              └── RabbitMQ Exchange: 'orders'
                        │
          ┌─────────────┼──────────────────────┐
          ▼             ▼             ▼         ▼           ▼          ▼
    Email Queue   PDF Queue  Analytics Queue  Warehouse  Inventory  Notification
          │             │             │           │
     Email Svc     PDF Svc    Analytics Svc  Warehouse Svc
```

One publish → all services react independently. No orchestrator needed.

---

## Project Structure

```
order-processing-system/
├── api/                        # Express REST API
│   ├── routes/                 # Route handlers (orders)
│   ├── queues/                 # BullMQ queue definitions
│   ├── db.ts                   # Prisma client singleton
│   └── server.ts               # Entry point + Bull Board
├── workers/                    # BullMQ background workers
│   ├── order.worker.ts         # Orchestrator worker
│   ├── email.worker.ts         # Email sub-worker
│   ├── pdf.worker.ts           # PDF sub-worker
│   ├── analytics.worker.ts     # Analytics sub-worker
│   ├── warehouse.worker.ts     # Warehouse sub-worker
│   └── notification.worker.ts  # Notification sub-worker
├── shared/                     # Shared code between api and workers
│   ├── queues/                 # Centralized queue definitions
│   └── utils/                  # Shared utilities (checkOrderCompletion)
├── rabbitmq-playground/        # RabbitMQ learning scripts
│   ├── publisher.ts            # Publishes to orders exchange
│   ├── consumer.ts             # order-processing consumer
│   ├── inventory-consumer.ts   # inventory consumer
│   ├── email-consumer.ts       # email consumer
│   ├── pdf-consumer.ts         # pdf consumer
│   ├── analytics-consumer.ts   # analytics consumer
│   ├── warehouse-consumer.ts   # warehouse consumer
│   └── notification-consumer.ts# notification consumer
├── prisma/                     # Database schema & migrations
│   └── schema.prisma
├── load-test.js                # Load testing script (1000 orders)
├── docker-compose.yml          # PostgreSQL + Redis
├── ROADMAP.md                  # Full learning roadmap (Phases 1-22)
└── .env.example                # Environment variable template
```

---

## Getting Started (BullMQ version)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/)

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
cd prisma && npm install
cd ../api && npm install
cd ../workers && npm install
```

### 3. Set up the database

```bash
cd prisma
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run the services

```bash
# API server (port 3000)
cd api && npm run dev

# All workers (email, pdf, analytics, warehouse, notification, order)
cd workers && npm run dev
```

### 5. Bull Board dashboard

Visit `http://localhost:3000/admin/queues` to monitor queues visually.

---

## Getting Started (RabbitMQ playground)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- RabbitMQ running via Docker:

```bash
docker run -d \
  --hostname rabbitmq \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### Run

```bash
cd rabbitmq-playground && npm install

# Start consumers (each in a separate terminal)
npx ts-node email-consumer.ts
npx ts-node pdf-consumer.ts
npx ts-node analytics-consumer.ts
npx ts-node warehouse-consumer.ts
npx ts-node notification-consumer.ts
npx ts-node inventory-consumer.ts
npx ts-node consumer.ts

# Publish a message
npx ts-node publisher.ts
```

Visit `http://localhost:15672` (guest/guest) to monitor RabbitMQ.

---

## API

### Create an order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_123",
    "items": [
      { "productId": "p1", "price": 10.99, "quantity": 2 },
      { "productId": "p2", "price": 5.50, "quantity": 1 }
    ]
  }'
```

**Response** `202 Accepted`:

```json
{
  "orderId": "clx...",
  "jobId": "1",
  "status": "PENDING"
}
```

### Check job progress

```bash
curl http://localhost:3000/orders/job/:jobId/progress
```

## Order Statuses

| Status | Description |
|---|---|
| `PENDING` | Order created, awaiting processing |
| `PROCESSING` | Worker is processing the order |
| `COMPLETED` | All sub-tasks completed successfully |
| `FAILED` | One or more sub-tasks permanently failed |

---

## Tech Stack

| Layer | BullMQ version | RabbitMQ version |
|---|---|---|
| Runtime | Node.js, TypeScript | Node.js, TypeScript |
| API | Express 5 | Express 5 |
| ORM | Prisma 5 + PostgreSQL | Prisma 5 + PostgreSQL |
| Queue/Broker | BullMQ + Redis | RabbitMQ (amqplib) |
| Infrastructure | Docker Compose | Docker Compose |

---

## Load Test Results

```
Total orders sent : 1000
Successful (202)  : 1000
Throughput        : 3584 req/s
p95 response time : 45ms
p99 response time : 47ms
```

---

## License

ISC
