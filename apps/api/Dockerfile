FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN npm install -g pnpm turbo

COPY . .
RUN turbo prune @shipflow/api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install -g pnpm

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=@shipflow/api...

# Production image, copy all the files and run
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend
USER backend

# Copy only the necessary files for production
COPY --from=installer --chown=backend:nodejs /app/apps/api/dist ./dist
COPY --from=installer --chown=backend:nodejs /app/apps/api/package.json .
COPY --from=installer --chown=backend:nodejs /app/node_modules ./node_modules

EXPOSE 8000
ENV PORT=8000

CMD ["node", "dist/index.js"]
