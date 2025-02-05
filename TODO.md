# TODO

## Roadmap for 1.0.0

- [ ] The API should be largely compatible with prom-client
    - [ ] Instruments
        - [x] Counter
        - [x] Gauge
        - [x] Histogram
        - [ ] Summary
    - [x] collect callback
    - [x] typed labels
    - [x] clear/reset
    - [ ] validation/escaping
- [x] Support massive amount of metrics
    - [x] Performance
    - [x] Streaming writer
- [x] TTL for metrics
- [x] Dynamic labels
- [x] Default common prefix
- [x] Default labels
- [x] Internal metrics
    - [x] Exposure bytes and duration
    - [x] Sample count
- [x] Adapters
    - [x] Express
    - [x] Fastify
    - [x] NestJS
- [ ] Documentation
    - [x] README
    - [x] Examples
    - [ ] API Docs
