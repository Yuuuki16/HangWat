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
RUN ["apk", "upgrade", "--no-cache", "openssl", "libssl3", "libcrypto3"]
RUN ["rm", "-rf", "/usr/local/lib/node_modules/npm", "/usr/local/bin/npm", "/usr/local/bin/npx"]
COPY --from=build /app/front/.next/standalone ./
COPY --from=build /app/front/.next/static front/.next/static
COPY --from=build /app/front/public front/public
COPY --from=build /app/node_modules/.pnpm/picomatch@4.0.4/node_modules/picomatch /app/node_modules/.pnpm/next@16.2.9_@babel+core@7.29.7_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/picomatch
EXPOSE 3000
CMD ["node", "front/server.js"]
