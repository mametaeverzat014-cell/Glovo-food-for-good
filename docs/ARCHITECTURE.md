# FoodSave — Architecture

## Overview

FoodSave is a two-tier application in this MVP:

- **`apps/web`** — Next.js 15 App Router client. Talks to the API over REST using a small
  `fetch` wrapper (`src/lib/api.ts`), server state via React Query, and auth/session state
  via Zustand (`src/store/auth.ts`). The JWT is stored in `localStorage` and attached as a
  `Bearer` token.
- **`apps/api`** — NestJS REST API. Modular by domain (auth, users, restaurants, offers,
  orders, reviews, favorites, notifications). Persistence via Prisma against PostgreSQL.

```
┌──────────────┐     REST/JSON + JWT     ┌──────────────┐     Prisma     ┌────────────┐
│  Next.js web │ ──────────────────────► │  NestJS API  │ ─────────────► │ PostgreSQL │
└──────────────┘                         └──────────────┘                └────────────┘
```

## Authentication & authorization

- `JwtAuthGuard` is registered as a **global guard**; every route requires a valid JWT
  unless decorated with `@Public()`.
- `RolesGuard` + `@Roles(...)` enforce role-based access (`CUSTOMER`, `RESTAURANT_OWNER`,
  `ADMIN`).
- `@CurrentUser()` injects the authenticated principal resolved by `JwtStrategy`.

## Data model

| Entity        | Notes                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `User`        | `role` drives permissions. Self-registration limited to customer/owner.|
| `Restaurant`  | Owned by a user; carries geo `lat/lng`, cached `rating` + `reviewCount`.|
| `Offer`       | Surplus listing. `status` ∈ AVAILABLE/SOLD_OUT/EXPIRED; derived `discountPercent`. |
| `Order`       | Reservation. `status` lifecycle + `paymentStatus`; unique `pickupCode`.|
| `Review`      | One per (user, restaurant); only after a `COMPLETED` order.            |
| `Favorite`    | Unique (user, restaurant).                                            |
| `Notification`| In-app messages generated during the order lifecycle.                 |

## Reservation lifecycle

```
            reserve            pay (mock)         pickup            complete
AVAILABLE ──────────► RESERVED ─────────► PAID ─────────► PICKED_UP ─────────► COMPLETED
                          │                  │
                          └──── cancel ──────┘  (stock returned, payment refunded if paid)
```

- **Reserve** runs inside a Prisma transaction: it re-reads the offer, validates stock and
  expiry, decrements `quantity`, and flips the offer to `SOLD_OUT` at zero — preventing
  overselling under concurrency.
- **Cancel** returns stock to the offer and refunds a paid order.

## Marketplace feed

`GET /offers` builds a Prisma `where` for the SQL-expressible filters (category, max price,
min restaurant rating, availability, non-expired). Distance and minimum-discount filters,
plus all sorting (`nearest`/`cheapest`/`discount`/`popular`), are computed in the service
layer because they depend on derived values (Haversine distance, discount %, order counts).

## Conventions

- DTOs validated with `class-validator`; the global `ValidationPipe` whitelists and
  transforms input.
- Money stored as Postgres `Decimal(10,2)`; serialized as strings and coerced on the client.
- Ownership checks live in the service layer (`assertOwnership`) so controllers stay thin.
