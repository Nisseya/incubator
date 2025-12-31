FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable

RUN apk add --no-cache python3 make g++ libc6-compat

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache postgresql-client libc6-compat

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
CMD ["/entrypoint.sh"]
