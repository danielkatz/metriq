FROM node:20-slim

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy all package.json files from monorepo
COPY packages/metriq/package*.json ./packages/metriq/
COPY packages/adapters/express/package*.json ./packages/adapters/express/
COPY benchmarks/package*.json ./benchmarks/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/metriq ./packages/metriq
COPY packages/adapters/express ./packages/adapters/express
COPY benchmarks ./benchmarks

# Build packages in correct order
RUN npm run build -w packages/metriq
RUN npm run build -w packages/adapters/express
RUN npm run build -w benchmarks

WORKDIR /app/benchmarks

EXPOSE 3001

CMD ["npm", "start", "src/prometheus.ts"]
