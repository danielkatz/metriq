# metriq

[![npm version](https://img.shields.io/npm/v/metriq.svg)](https://www.npmjs.com/package/metriq)
[![License](https://img.shields.io/npm/l/metriq.svg)](https://www.npmjs.com/package/metriq)

A high-performance TypeScript metrics collection library designed for heavy workloads. Metriq provides a modern, type-safe API for collecting and exposing metrics with exceptional performance characteristics.

## ⚡ Performance

- **7.5x faster** than prom-client when exposing 1M timeseries
- **High Performance**: Optimized for millions of timeseries
- **Non-blocking**: All operations are non-blocking by design
- **Memory Efficient**: Streaming metrics prevent memory spikes

## 🔑 Key Features

- **TTL Support**: Supports removal of least recently used timeseries
- **Dynamic Labels**: Supports optional labels on the fly
- **Testable Design**: No singletons, simple access to metric values
- **OpenMetrics Support**: Automatic content negotiation between Prometheus and OpenMetrics formats

## 📚 Packages

- [`metriq`](metriq/README.md) - Core metrics collection library
- [`@metriq/express`](adapters/express/README.md) - Express adapter
- [`@metriq/fastify`](adapters/fastify/README.md) - Fastify adapter
- [`@metriq/nestjs`](adapters/nestjs/README.md) - NestJS adapter

## 📦 Usage

```bash
# Core library
npm install metriq

# Optional: convenience adapters for Express, Fastify, NestJS
npm install @metriq/express
```

## 🚀 Quick Start

```typescript
import express from "express";
import { metriq } from "metriq";
import { prometheus } from "@metriq/express";

// Initialize metrics
const metrics = metriq({
    // Automatically remove timeseries not updated in 1 hour
    defaultTtl: 3600000,
});

// Create a counter with typed labels
type RequestLabels = {
    method: string;
    path: string;
};

const requests = metrics.createCounter<RequestLabels>("http_requests_total", "Total HTTP requests");

// Dynamic labels - no pre-registration needed
requests.increment({
    method: "GET",
    path: "/api/users",
    status: "200", // Additional label on the fly
});

// Create Express app and expose metrics
const app = express();
app.get("/metrics", prometheus(metrics));
app.listen(3000);

// Access metric values (great for testing)
console.log(requests.getDebugValue({ method: "GET", path: "/api/users" }));
```

## 🛠️ Development

This repository uses npm workspaces. To get started:

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License

MIT
