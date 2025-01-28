# Build context is the repo ROOT:
#   docker build -f apps/web/Dockerfile .
#
# The bundle is produced here, in the image, from source. Vite inlines
# import.meta.env at build time, so VITE_* are build args and not runtime env:
# whatever they say is baked into the JS that ships.

FROM node:22-alpine AS deps
WORKDIR /app
# @playwright/test pulls ~150MB of browsers on install and nothing in this image
# ever runs them
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @euphoria/web --include-workspace-root

FROM deps AS build
# absolute, because the api client builds every request with `new URL()` and a bare
# path has nothing to resolve against. the default matches the port compose
# publishes; a deployment on any other host has to pass its own.
ARG VITE_API_URL=http://localhost:8080/api
ARG VITE_GOOGLE_AUTH=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_AUTH=$VITE_GOOGLE_AUTH
COPY tsconfig.base.json ./
COPY apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/
COPY apps/web/vite.config.ts apps/web/index.html apps/web/
COPY apps/web/public apps/web/public
COPY apps/web/src apps/web/src
RUN npm run build --workspace @euphoria/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
