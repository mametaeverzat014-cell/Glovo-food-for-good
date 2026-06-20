# 🥗 FoodSave

**A marketplace that helps restaurants, cafes, bakeries and supermarkets sell their unsold food at the end of the day at a 50–70% discount.**

Customers get quality food cheaper, and businesses reduce waste while recovering revenue.

> This repository contains the **MVP foundation**: a full-stack monorepo with a working
> customer marketplace, a restaurant dashboard, the reservation/payment lifecycle, reviews
> and favorites. AI features, payment-gateway integrations, maps and push notifications are
> documented in [`docs/ROADMAP.md`](docs/ROADMAP.md) as the next phases.

---

## Monorepo layout

```
foodsave/
├── apps/
│   ├── api/     # NestJS REST API + Prisma + PostgreSQL
│   └── web/     # Next.js 15 + Tailwind + React Query + Zustand
├── docs/        # Architecture & roadmap
└── package.json # npm workspaces root
```

## Tech stack (implemented)

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Frontend     | Next.js 15 (App Router), TypeScript, Tailwind CSS, React Query, Zustand |
| Backend      | NestJS, TypeScript, REST API, JWT auth                |
| Database     | PostgreSQL via Prisma ORM                             |

## Features in this MVP

- **Auth** — email/password registration & login with JWT, role-based access (Customer / Restaurant Owner / Admin).
- **Marketplace feed** — public offer feed with filters (category, price, discount %, rating) and sorting (nearest, cheapest, highest discount, most popular).
- **Restaurant dashboard** — create restaurants, publish surplus offers, track live inventory.
- **Reservation lifecycle** — `RESERVED → PAID → PICKED_UP → COMPLETED` (and `CANCELLED`), with atomic stock decrement so offers can't be oversold.
- **Reviews** — verified buyers rate restaurants (food quality, value, pickup experience); average rating recomputed automatically.
- **Favorites & notifications** — save restaurants, receive in-app order notifications.

---

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (local, [Supabase](https://supabase.com), Railway, etc.)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# edit apps/api/.env and set DATABASE_URL + JWT_SECRET
```

### 3. Set up the database

```bash
npm run prisma:generate
npm run prisma:migrate     # creates tables
npm run prisma:seed        # loads demo restaurants, offers and users
```

### 4. Run both apps

```bash
npm run dev
# API → http://localhost:4000/api
# Web → http://localhost:3000
```

Or run them individually with `npm run dev:api` / `npm run dev:web`.

### Demo accounts (after seeding)

| Role            | Email                  | Password      |
| --------------- | ---------------------- | ------------- |
| Admin           | `admin@foodsave.kz`    | `password123` |
| Restaurant owner| `owner@foodsave.kz`    | `password123` |
| Customer        | `customer@foodsave.kz` | `password123` |

---

## API overview

Base URL: `http://localhost:4000/api`

| Method | Route                          | Auth        | Description                         |
| ------ | ------------------------------ | ----------- | ----------------------------------- |
| POST   | `/auth/register`               | public      | Create account                      |
| POST   | `/auth/login`                  | public      | Login, returns JWT                  |
| GET    | `/auth/me`                     | user        | Current profile                     |
| GET    | `/offers`                      | public      | Marketplace feed (filters + sort)   |
| GET    | `/offers/:id`                  | public      | Offer detail                        |
| POST   | `/offers`                      | owner       | Publish a surplus offer             |
| GET    | `/restaurants`                 | public      | List restaurants                    |
| POST   | `/restaurants`                 | owner       | Register a business                 |
| PATCH  | `/restaurants/:id/verify`      | admin       | Verify a restaurant                 |
| POST   | `/orders`                      | customer    | Reserve an offer                    |
| POST   | `/orders/:id/pay`              | customer    | Pay (mock) → `PAID`                 |
| POST   | `/orders/:id/pickup`           | owner       | Mark collected → `PICKED_UP`        |
| POST   | `/orders/:id/complete`         | customer    | Confirm → `COMPLETED`               |
| POST   | `/reviews`                     | customer    | Review a restaurant you ordered from|
| GET    | `/favorites`                   | user        | List saved restaurants              |
| GET    | `/notifications`               | user        | In-app notifications                |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data model and design notes.
