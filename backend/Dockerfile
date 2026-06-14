FROM node:22-alpine AS deps
WORKDIR /app/backend
RUN apk add --no-cache openssl
COPY backend/package.json ./package.json
COPY prisma /app/prisma
RUN npm install --omit=dev
RUN npx prisma generate --schema=/app/prisma/schema.prisma

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps --chown=appuser:appgroup /app/backend/node_modules ./backend/node_modules
COPY --chown=appuser:appgroup backend/dist ./backend/dist
COPY --chown=appuser:appgroup backend/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --chown=appuser:appgroup prisma ./prisma
RUN chmod +x docker-entrypoint.sh
USER appuser
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "backend/dist/index.js"]
