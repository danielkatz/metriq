# Metriq Benchmarks

Performance benchmarks comparing Metriq against prom-client.

## 🏃 Running Benchmarks

```bash
npm run bench
```

## 📊 Latest Micro-Benchmarks

| Cardinality | Metriq (ops/sec) | prom-client (ops/sec) | Difference |
|-------------|------------------|----------------------|------------|
| 10          | 26,998          | 106,190              | 0.25x      |
| 100         | 19,358          | 10,974               | 1.76x      |
| 1,000       | 4,164           | 1,020                | 4.08x      |
| 10,000      | 477             | 88                   | 5.42x      |
| 100,000     | 45              | 6.8                  | 6.65x      |
| 1,000,000   | 4.3             | 0.47                 | 9.13x      |

> Note: Higher cardinality means more unique combinations of label values.
