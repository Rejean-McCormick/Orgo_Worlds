FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/prisma ./apps/api/prisma
RUN npm install --no-audit --no-fund
COPY apps/api ./apps/api
RUN npm run db:generate && npm run build -w api
ENV NODE_ENV=production PORT=4100
USER node
EXPOSE 4100
CMD ["node", "apps/api/dist/main.js"]
