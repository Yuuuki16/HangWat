FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --config.unsafe-perm=true

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=build --chown=appuser:appgroup /app/public ./public
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]
