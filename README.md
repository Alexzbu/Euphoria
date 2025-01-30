# Euphoria

A clothing e-commerce storefront: browse a filtered catalog, pick a size and colour, pay with
Stripe, and manage the catalog from an admin area. TypeScript end to end, in an npm workspaces
monorepo.

- **API**: Express 5, MongoDB via Mongoose, Zod-validated requests, JWT auth
- **Web**: React 19, Vite 6, React Router 7, TanStack Query, CSS Modules
- **Infra**: Docker Compose (Mongo + API + nginx), GitHub Actions running lint, typecheck, tests,
  builds and image builds

## Features

**Storefront**: paginated catalog filtered by category, brand, colour, size, department and price,
with full-text search. Product pages resolve a colour and size to a single stock-tracked variant.
The cart works signed out, lives in `localStorage`, and merges into the account cart at sign-in.
Checkout captures a shipping address, creates the order server side, then confirms a Stripe payment
intent. Accounts get an order history.

**Admin**: create and edit products, upload images, manage per-variant stock, and edit the
taxonomy (categories, brands, colours, sizes, departments). Admin routes sit behind their own
`/api/admin` prefix and a role guard.

**Auth**: email and password, or Google OAuth when it is configured. A short-lived access token is
held in memory by the browser and sent as a bearer token. The refresh token is an httpOnly cookie
scoped to `/api/auth`, so page scripts cannot read it. Repeated failed logins lock an account
temporarily, and the auth routes carry a tighter rate limit than the rest of the API.

## Architecture

```
                   ┌──────────────────────────────────────────────┐
                   │  browser                                     │
                   │  React 19 · React Router · TanStack Query    │
                   └────────────────────┬─────────────────────────┘
                                        │  bearer access token (memory)
                                        │  refresh cookie on /api/auth
                   ┌────────────────────▼─────────────────────────┐
                   │  nginx           (container image only)      │
                   │  serves the built bundle, proxies /api /media│
                   └────────────────────┬─────────────────────────┘
                                        │
                   ┌────────────────────▼─────────────────────────┐
                   │  Express 5 API                               │
                   │                                              │
                   │   routes ─► middleware ─► controllers        │
                   │             rate limit                │      │
                   │             requireAuth / role        │      │
                   │             zod validate              ▼      │
                   │             multipart upload      services   │
                   │                                       │      │
                   │                                       ▼      │
                   │                                    models    │
                   └───────┬─────────────────┬────────────────┬───┘
                           │                 │                │
                  ┌────────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
                  │  MongoDB      │  │  image store │  │  Stripe     │
                  │  Mongoose 8   │  │  disk or S3  │  │  payments   │
                  └───────────────┘  └──────────────┘  └─────────────┘
```

Every request lands on a route that names its own guards, so what a path requires is visible at the
path. Controllers handle HTTP and nothing else; the domain logic lives in services, and only
services touch models. Failures leave through one error handler as a JSON envelope:

```json
{ "error": { "code": "NOT_FOUND", "message": "Product not found", "requestId": "..." } }
```

In development the Vite dev server on `:5173` calls the API on `:3000` directly, and the API's CORS
origin is that exact URL. In the Docker stack there is no dev server: nginx serves the built bundle
and proxies `/api` and `/media` to the API container, so everything is same-origin on `:8080`.

Money is stored and calculated in integer cents. Prices are never multiplied as floats, because
19.99 has no exact binary representation and the error compounds across a cart. Payment amounts come
from the stored order, never from the request body.

## Layout

```
apps/
  api/                  Express 5 + TypeScript
    src/
      config/           env schema, logger, stripe client
      db/               connection, seed
      models/           Mongoose schemas
      services/         domain logic
      controllers/      HTTP handlers
      routes/           route definitions and guards
      middleware/       auth, validation, errors, uploads, rate limit
      schemas/          Zod request schemas
      storage/          image storage adapters (disk, S3)
      utils/
    tests/              Vitest + Supertest, in-memory MongoDB
    Dockerfile
  web/                  React 19 + TypeScript + Vite 6
    src/
      api/              typed client, error mapping
      app/              providers
      components/       shared UI and layout
      features/         catalog, cart, checkout, auth, admin, orders
      pages/
      routes/           route table, protected routes
      styles/           design tokens and global CSS
    tests/              Vitest + Testing Library + MSW
    e2e/                Playwright
    nginx/
    Dockerfile
.github/workflows/      CI
docker-compose.yml
```

## Quickstart

Requires **Node 22** (`.nvmrc` pins it) and **npm 10**. Docker is the easiest way to get MongoDB,
but any MongoDB 8 you can reach will do.

```bash
npm install
```

Start a database:

```bash
docker run -d --name euphoria-mongo -p 27017:27017 -v euphoria-mongo:/data/db mongo:8.0
```

Configure the API. This is the minimum that boots; everything else has a default:

```bash
cat > apps/api/.env <<'EOF'
WEB_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/euphoria

# at least 32 characters
JWT_ACCESS_SECRET=replace-this-with-a-long-random-development-secret

# localhost is plain http, and a Secure cookie the browser refuses to send
# looks exactly like a login that silently expired
COOKIE_SECURE=false

SEED_ADMIN_EMAIL=admin@euphoria.local
SEED_ADMIN_PASSWORD=choose-a-password
EOF
```

Load the catalog and create the admin account:

```bash
npm run seed
```

Run both apps:

```bash
npm run dev
```

The storefront is on <http://localhost:5173> and the API on <http://localhost:3000>. Sign in with
the seed admin to reach `/admin`. The seed is idempotent: it upserts 12 products across 5
categories, 5 brands, 5 colours and 5 sizes, and it never overwrites an existing admin's password.

### Configuration

`apps/api/src/config/env.ts` is the authority on what the API accepts. It parses the environment
once at startup with Zod and refuses to boot on anything invalid, printing every problem at once
rather than one per restart. Beyond the values above it covers token lifetimes, rate limits, cookie
attributes, proxy hop count, and three optional feature groups that are all-or-nothing: Google
OAuth, Stripe, and S3 image storage. With none of them set the app runs on disk-backed images, local
sign-in, and no payment step.

The web app reads three build-time variables: `VITE_API_URL` (defaults to
`http://localhost:3000/api`), `VITE_GOOGLE_AUTH`, and `VITE_STRIPE_PUBLISHABLE_KEY`. Vite inlines
them at build time, so changing one means rebuilding.

### The whole stack in Docker

```bash
docker compose up --build
docker compose run --rm api node dist/db/seed.js
```

Everything is then served from <http://localhost:8080>. Mongo and the API publish on `127.0.0.1`
only, so a shell on the host can reach them and the network cannot.

## Scripts

Run from the repository root. Each fans out across the workspaces.

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | API with watch-mode reload, and the Vite dev server |
| `npm run build`     | Type-checked build of both apps                     |
| `npm test`          | Unit and integration tests                          |
| `npm run typecheck` | Project-wide `tsc -b`                               |
| `npm run lint`      | ESLint 9 flat config                                |
| `npm run format`    | Prettier                                            |
| `npm run seed`      | Seed the database                                   |
| `npm run verify`    | lint, typecheck, test, build, in that order         |

`npm run test:e2e --workspace @euphoria/web` runs the Playwright suite. It builds the bundle,
previews it, and answers the API from inside the browser, so it needs no database and no Stripe
keys.

## Testing

The API suite spins up an in-memory MongoDB per run and drives the real Express app through
Supertest, so routing, guards, validation and error mapping are all exercised. The web suite renders
components and hooks against MSW handlers. The end-to-end suite drives the production bundle in
Chromium through a full purchase.

`npm run verify` is the gate. CI runs the same chain on every push and pull request, plus the
Playwright suite and a build of both container images.

## Health

`GET /health` reports liveness and the database connection, and answers 503 when the database is
unreachable so a load balancer can pull the instance out of rotation. It sits outside `/api` and
needs no credentials.

## License

MIT
