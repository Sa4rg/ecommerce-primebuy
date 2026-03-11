FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --filter api... --frozen-lockfile

COPY apps/api ./apps/api

WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "start"]