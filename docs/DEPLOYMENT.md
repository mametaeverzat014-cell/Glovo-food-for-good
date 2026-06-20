# Deploying FoodSave

FoodSave has two deployable pieces:

- **Frontend** (`apps/web`, Next.js) → **Vercel**
- **Backend** (`apps/api`, NestJS) + **PostgreSQL** → **Render** (or Railway)

Deploy the backend first so you have an API URL to give the frontend.

---

## 1. Backend + database → Render

A [`render.yaml`](../render.yaml) blueprint is included. It provisions the API
(as a Docker service) and a free PostgreSQL database.

1. Push this repo to GitHub (already done on your branch).
2. In Render: **New + → Blueprint**, select this repository.
3. Render reads `render.yaml` and creates:
   - `foodsave-db` — PostgreSQL (free)
   - `foodsave-api` — Docker web service, `DATABASE_URL` auto-wired, `JWT_SECRET` auto-generated.
4. After the API is live, set the **`CORS_ORIGINS`** env var on `foodsave-api` to your
   Vercel URL (e.g. `https://foodsave.vercel.app`) and redeploy.
5. Note the API base URL, e.g. `https://foodsave-api.onrender.com`. The app's prefix is
   `/api`, so the full base is `https://foodsave-api.onrender.com/api`.

> On boot the container runs `prisma db push` to sync the schema, then starts the server.
> To load demo data, run `npm run prisma:seed` once against the production `DATABASE_URL`
> (locally, with `DATABASE_URL` exported), or from a Render Shell.

### Railway alternative

Railway works too: create a project from the repo, set the service root to `apps/api`,
add a PostgreSQL plugin (provides `DATABASE_URL`), set `JWT_SECRET` and `CORS_ORIGINS`,
and use start command `npm run start:prod` (build with the Dockerfile or `npm run build`).

---

## 2. Frontend → Vercel

The root [`vercel.json`](../vercel.json) builds `apps/web` from the workspace root.

1. Import the repo in Vercel (or use the Vercel integration / `deploy_to_vercel`).
2. Set the environment variable:
   - **`NEXT_PUBLIC_API_URL`** = your API base, e.g. `https://foodsave-api.onrender.com/api`
3. Deploy. Vercel runs `npm run build --workspace=apps/web`.

> `NEXT_PUBLIC_*` vars are inlined at build time, so after setting/changing it you must
> trigger a new deployment.

---

## Wiring checklist

- [ ] API deployed, `/api/health` returns `{ "status": "ok" }`
- [ ] `DATABASE_URL` + `JWT_SECRET` set on the API
- [ ] (optional) demo data seeded
- [ ] `NEXT_PUBLIC_API_URL` set on Vercel → points at the API `/api` base
- [ ] `CORS_ORIGINS` on the API → includes the Vercel domain
- [ ] Redeploy frontend after setting env vars
