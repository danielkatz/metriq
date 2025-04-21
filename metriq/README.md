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

## 📦 Installation

```bash
# Core library
npm install metriq

# Express middleware
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

## 📊 Instruments

### Counter

Monotonically increasing counter.

```typescript
const counter = metrics.createCounter("counter", "help text");

// Increment without labels
counter.increment();
counter.increment(5);

// Increment with labels
counter.increment({ path: "/api" });
counter.increment({ path: "/api" }, 5);

// Remove specific metric
counter.remove({ path: "/api" });

// Remove all metrics
counter.removeAll();
```

### Gauge

Single numeric value that can go up and down.

```typescript
const gauge = metrics.createGauge("gauge", "help text");

// Set/increment without labels
gauge.set(42);
gauge.increment();
gauge.increment(5);

// Set/increment with labels
gauge.set({ service: "api" }, 42);
gauge.increment({ service: "api" });
gauge.increment({ service: "api" }, 5);

// Remove/clear
gauge.remove({ service: "api" });
gauge.removeAll();
```

### Histogram

Samples observations in buckets.

```typescript
const histogram = metrics.createHistogram("histogram", "help text", {
    buckets: [0.1, 0.5, 1, 2, 5],
});

// Observe without labels
histogram.observe(0.123);

// Observe with labels
histogram.observe({ status: "200" }, 0.123);

// Remove/clear
histogram.remove({ status: "200" });
histogram.removeAll();
```

## 🔧 Configuration

```typescript
const metrics = metriq({
    // Common prefix for all metrics
    commonPrefix: "myapp_",

    // Default labels added to all metrics
    commonLabels: { app: "api", env: "prod" },

    // Default TTL for all metrics
    defaultTtl: 3600000,

    // Enable internal metrics
    enableInternalMetrics: true,
});
```

## 📊 Registry

```typescript
const registry = metrics.createRegistry({
    // Common prefix for all metrics in this registry
    commonPrefix: "myapp_",

    // Default labels added to all metrics in this registry
    commonLabels: { app: "api", env: "prod" },

    // Default TTL for all metrics in this registry
    defaultTtl: 3600000,
});

// Create a counter in the registry
registry.createCounter("counter", "help text");
```

## 📚 Adapters

- [`@metriq/express`](adapters/express/README.md) - Express
- [`@metriq/fastify`](adapters/fastify/README.md) - Fastify
- [`@metriq/nestjs`](adapters/nestjs/README.md) - NestJS
