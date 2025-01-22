# metriq

Core metrics collection library with exceptional performance characteristics.

## 📦 Installation

```bash
npm install metriq
```

## 🚀 Quick Start

```typescript
import { metriq } from 'metriq';

// Initialize metrics
const metrics = metriq();

// Create a counter with typed labels
type RequestLabels = { method: string; path: string };
const counter = metrics.createCounter<RequestLabels>(
  'http_requests_total',
  'Total HTTP requests'
);

// Increment counter
counter.increment({ method: 'GET', path: '/api/users' });
counter.increment({ method: 'POST', path: '/api/users' }, 5);

// Create a gauge
const gauge = metrics.createGauge('active_connections', 'Number of active connections');
gauge.increment(5);
gauge.increment({ service: 'api' }, 3);

// Create a histogram
const histogram = metrics.createHistogram(
  'request_duration_seconds',
  'Request duration in seconds',
  { buckets: [0.1, 0.5, 1, 2, 5] }
);
histogram.observe(0.123);
histogram.observe({ method: 'GET' }, 0.123);
```

## 🔧 Configuration

```typescript
const metrics = metriq({
  // Default labels added to all metrics
  commonLabels: { app: 'api', env: 'prod' },
  
  // Enable internal metrics
  enableInternalMetrics: true
});

// Create a registry with common prefix
const registry = metrics.createRegistry({ 
  commonPrefix: 'myapp_'
});
```

## 📊 Instruments

### Counter

Monotonically increasing counter.

```typescript
const counter = metrics.createCounter('counter', 'help text');

// Increment without labels
counter.increment();
counter.increment(5);

// Increment with labels
counter.increment({ path: '/api' });
counter.increment({ path: '/api' }, 5);

// Remove specific metrics
counter.remove({ path: '/api' });

// Clear all metrics
counter.clear();
```

### Gauge

Single numeric value that can go up and down.

```typescript
const gauge = metrics.createGauge('gauge', 'help text');

// Set/increment without labels
gauge.set(42);
gauge.increment();
gauge.increment(5);

// Set/increment with labels
gauge.set({ service: 'api' }, 42);
gauge.increment({ service: 'api' });
gauge.increment({ service: 'api' }, 5);

// Remove/clear
gauge.remove({ service: 'api' });
gauge.clear();
```

### Histogram

Samples observations in buckets.

```typescript
const histogram = metrics.createHistogram(
  'histogram', 
  'help text',
  { buckets: [0.1, 0.5, 1, 2, 5] }
);

// Observe without labels
histogram.observe(0.123);

// Observe with labels
histogram.observe({ status: '200' }, 0.123);

// Remove/clear
histogram.remove({ status: '200' });
histogram.clear();
```
