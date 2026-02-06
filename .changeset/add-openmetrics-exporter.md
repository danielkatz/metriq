---
"metriq": "minor"
"@metriq/express": "minor"
"@metriq/fastify": "minor"
"@metriq/nestjs": "minor"
---

Add OpenMetrics text format exporter with automatic content negotiation. When a scrape client sends `Accept: application/openmetrics-text`, the response uses OpenMetrics format (counter `_total` suffix, `# EOF` terminator). Default remains Prometheus text format. New exports: `MetricsFormatter` interface.
