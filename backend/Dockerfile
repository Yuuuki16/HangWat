FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY backend/dist ./dist
COPY backend/node_modules ./node_modules
COPY prisma ./prisma

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000
CMD ["node", "dist/index.js"]
