FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY front/package.json front/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY front front
RUN pnpm --filter front build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN ["apk", "upgrade", "--no-cache", "openssl", "libssl3", "libcrypto3"]
RUN ["rm", "-rf", "/usr/local/lib/node_modules/npm", "/usr/local/bin/npm", "/usr/local/bin/npx"]
COPY --from=build --chown=appuser:appgroup /app/front/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/front/.next/static front/.next/static
COPY --from=build --chown=appuser:appgroup /app/front/public front/public
USER appuser
EXPOSE 3000
CMD ["node", "front/server.js"]
