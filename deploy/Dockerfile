# ── Stage 1: Install dependencies ──────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ─────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Baked into the build at build time (rewrites + client bundle)
ARG NEXT_PUBLIC_BASALT_WS_URL=wss://testnet.basalt.foundation
ARG NEXT_PUBLIC_BASALT_API_URL=http://validator-0:5000
ENV NEXT_PUBLIC_BASALT_WS_URL=$NEXT_PUBLIC_BASALT_WS_URL
ENV NEXT_PUBLIC_BASALT_API_URL=$NEXT_PUBLIC_BASALT_API_URL

RUN mkdir -p public && npm run build

# ── Stage 3: Runtime ───────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
