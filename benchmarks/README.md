# Metriq Benchmarks

Performance benchmarks comparing Metriq against prom-client.

## 🏃 Running Benchmarks

```bash
npm run bench
```

## 📊 Latest Express Benchmarks

| Cardinality | Metriq (ops/sec) | prom-client (ops/sec) | Difference |
|-------------|------------------|----------------------|------------|
| 1,000       | 1,320.71        | 706.62               | 1.87x      |
| 10,000      | 317.27          | 72.79                | 4.36x      |
| 100,000     | 37.04           | 5.08                 | 7.29x      |
| 500,000     | 7.85            | 1.06                 | 7.44x      |
| 1,000,000   | 3.67            | 0.44                 | 8.37x      |

> Note: Higher cardinality means more unique combinations of label values.
