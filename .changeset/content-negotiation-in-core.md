---
"metriq": "minor"
"@metriq/express": "minor"
"@metriq/fastify": "minor"
"@metriq/nestjs": "minor"
---

Move protocol negotiation (Accept header) into core via `scrapeHandler`. Core is now usable standalone; adapters are thin "last mile" wrappers. New exports: `scrapeHandler(metrics)`, `ScrapeHandler`, `ScrapeResult`.
