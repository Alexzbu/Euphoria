# Build context is the repo ROOT, not this directory:
#   docker build -f apps/api/Dockerfile .
# npm ci needs the root lockfile and every workspace manifest it describes, and
# neither is reachable from a context rooted at apps/api.

FROM node:22-alpine AS base
WORKDIR /app

# manifests only, so a source-only change reuses the installed layer
FROM base AS deps
# bcrypt publishes no musl prebuild, so it compiles from source. the toolchain
# stays in this stage and never reaches the runtime image.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# --include-workspace-root brings in the root devDeps (typescript), and leaving
# apps/web out keeps playwright's browsers off this image
RUN npm ci --workspace @euphoria/api --include-workspace-root

FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/api/tsconfig.json apps/api/
COPY apps/api/src apps/api/src
RUN npm run build --workspace @euphoria/api
# compiled native modules survive the prune, tsc doesn't
RUN npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
# absolute, so the volume mount point doesn't depend on where node was started
ENV UPLOAD_DIR=/app/uploads

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/dist ./apps/api/dist

RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node
WORKDIR /app/apps/api
EXPOSE 3000

# busybox wget, already in the base image. /health answers 503 while mongo is
# down, which is what makes this worth checking at all.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1

CMD ["node", "dist/index.js"]
