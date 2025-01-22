# Metriq

A high-performance TypeScript metrics collection library designed for heavy workloads. Metriq provides a modern, type-safe API for collecting and exposing metrics with exceptional performance characteristics.

## ⚡ Performance

- **7.5x faster** than prom-client when exposing 1M timeseries
- Entirely non-blocking architecture
- Optimized for high-throughput scenarios
- Efficient memory usage with streaming exports

## 🔑 Key Features

- **Type-safe API**: Full TypeScript support with typed labels
- **High Performance**: Optimized for handling millions of timeseries
- **Non-blocking**: All operations are non-blocking by design
- **Memory Efficient**: Streaming exports prevent memory spikes
- **Advanced Features**:
  - TTL for metrics
  - Dynamic labels
  - Streaming writer

## 📦 Packages

- [`metriq`](metriq/README.md) - The core metrics collection and reporting library
- [`@metriq/express`](adapters/express/README.md) - Express middleware for Metriq

## 🚀 Quick Start

```bash
npm install metriq
```

```typescript
import { metriq } from 'metriq';

// Initialize metrics
const metrics = metriq();

// Create a counter with typed labels
type RequestLabels = {
  method: string;
  path: string;
};

const requestCounter = metrics.createCounter<RequestLabels>(
  'http_requests_total',
  'Total HTTP requests'
);

// Increment counter
requestCounter.increment({ method: 'GET', path: '/api/users' });

// Increment by specific amount
requestCounter.increment({ method: 'POST', path: '/api/users' }, 5);
```

## 🛠️ Development

This repository uses npm workspaces. To get started:

1. Install dependencies:
```bash
npm install
```

2. Build all packages:
```bash
npm run build
```

3. Run tests:
```bash
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

## Development

This repository uses npm workspaces. To get started:

1. Install dependencies:
```bash
npm install
```

2. Build all packages:
```bash
npm run build
```

3. Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
