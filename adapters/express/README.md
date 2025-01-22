# @metriq/express

Express middleware adapter for Metriq metrics library.

## 📦 Installation

```bash
npm install @metriq/express
```

## 🚀 Quick Start

```typescript
import express from 'express';
import { metriq } from 'metriq';
import { prometheus } from '@metriq/express';

// Initialize metrics
const metrics = metriq();

// Create a counter
const counter = metrics.createCounter(
  'http_requests_total',
  'Total HTTP requests'
);

// Create Express app
const app = express();

// Add metrics endpoint
app.get('/metrics', prometheus(metrics));

app.listen(3000);
```

## 🔧 Request Monitoring Example

```typescript
import express from 'express';
import { metriq } from 'metriq';
import { prometheus } from '@metriq/express';

const app = express();
const metrics = metriq();

// Create metrics
const requests = metrics.createCounter<{
  method: string;
  path: string;
  status: string;
}>('http_requests_total', 'Total HTTP requests');

const latency = metrics.createHistogram<{
  method: string;
  path: string;
}>('http_request_duration_seconds', 'Request duration in seconds', {
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Middleware to track requests
app.use((req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;
    
    const labels = {
      method: req.method,
      path: req.route?.path ?? 'unknown',
      status: res.statusCode.toString()
    };
    
    requests.increment(labels);
    latency.observe({ 
      method: labels.method, 
      path: labels.path 
    }, duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', prometheus(metrics));

app.listen(3000);
``` 