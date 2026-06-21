# Order Processing System

An asynchronous order processing system built with Express, Prisma, PostgreSQL, BullMQ, and Redis.

## Architecture

```
Client → API (Express) → PostgreSQL (persist order)
                      ↘ Redis/BullMQ (enqueue job)
                                    ↓
                              Worker (process order)
```

1. **API** receives order requests, saves them to the database, and enqueues a background job.
2. **Worker** picks up jobs from the Redis queue and processes orders asynchronously.
3. **Prisma** manages the PostgreSQL schema and database access.

## Project Structure

```
order-processing-system/
├── api/                 # Express REST API
│   ├── routes/          # Route handlers
│   ├── queues/          # BullMQ queue definitions
│   ├── db.ts            # Prisma client singleton
│   └── server.ts        # Entry point
├── workers/             # Background job processors
│   └── order.worker.ts  # Order processing worker
├── prisma/              # Database schema & migrations
│   └── schema.prisma
├── docker-compose.yml   # PostgreSQL + Redis
└── .env.example         # Environment variable template
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) (for PostgreSQL and Redis)

## Getting Started

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Configure environment

```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env` if needed. The default matches the Docker Compose setup.

### 3. Install dependencies

```bash
cd prisma && npm install
cd ../api && npm install
cd ../workers && npm install
```

### 4. Set up the database

```bash
cd prisma
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run the services

In separate terminals:

```bash
# API server (port 3000)
cd api && npm run dev

# Background worker
cd workers && npm run dev
```

## API

### Create an order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_123",
    "items": [
      { "price": 10.99, "quantity": 2 },
      { "price": 5.50, "quantity": 1 }
    ]
  }'
```

**Response** `202 Accepted`:

```json
{
  "orderId": "clx...",
  "status": "PENDING"
}
```

## Order Statuses

| Status       | Description                        |
|--------------|------------------------------------|
| `PENDING`    | Order created, awaiting processing |
| `PROCESSING` | Worker is processing the order     |
| `COMPLETED`  | Order processed successfully       |
| `FAILED`     | Order processing failed            |

## Tech Stack

- **Runtime:** Node.js, TypeScript
- **API:** Express 5
- **ORM:** Prisma 5 + PostgreSQL
- **Queue:** BullMQ + Redis
- **Infrastructure:** Docker Compose

## License

ISC
