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
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY front/package.json front/package.json
RUN pnpm install --frozen-lockfile --prod --filter front
COPY --from=build /app/front/.next front/.next
COPY --from=build /app/front/public front/public
COPY --from=build /app/front/next.config.ts front/next.config.ts
EXPOSE 3000
CMD ["pnpm", "--filter", "front", "start"]
