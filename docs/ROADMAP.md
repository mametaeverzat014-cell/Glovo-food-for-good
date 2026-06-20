# FoodSave — Roadmap

The current repository delivers the **core marketplace MVP**. The items below map the
remaining product spec to future phases.

## Next up (Phase 1.x)

- **Restaurant pickup confirmation UI** — owner-side order list to mark `PICKED_UP`
  (API already exists at `POST /orders/:id/pickup`).
- **Map view** — Google Maps API with OpenStreetMap fallback, showing nearby restaurants,
  active deals and distance. Backend already returns geo + distance.
- **Live inventory via WebSockets** — push quantity changes to the feed in real time
  (currently React Query refetch).
- **Image upload** — S3 / Cloudflare R2 instead of pasting image URLs.

## Payments

- Integrate **Kaspi Pay**, **Halyk Pay** and **Stripe**. The order lifecycle already has a
  `PAID`/`REFUNDED` `paymentStatus`; the mock `pay` endpoint is the integration seam.

## Notifications

- **Firebase push**, email and SMS gateways. In-app `Notification` records are already
  written during the order lifecycle and can fan out to these channels.

## AI features

- **Demand prediction** (XGBoost / LightGBM): predict unsold meals, best discount and best
  posting time.
- **Dynamic pricing**: suggest 30 / 50 / 70% discounts based on demand.
- **Food-waste analytics**: meals saved, money recovered, CO₂ avoided.

## Platform / scale

- Redis caching + BullMQ background jobs (expiring offers, digests).
- Split the modular monolith into services (Auth, User, Restaurant, Offer, Order, Payment,
  Notification, Analytics) communicating over RabbitMQ/Kafka.
- Sentry + PostHog monitoring; Cloudflare CDN.

## Auth expansion

- Google and Apple sign-in, phone verification (the `phoneVerified` flag already exists).
