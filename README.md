Metrics library targeting nodejs and prometheus (to start with)

- [ ] The API should be largely compatible with prom-client
    - [ ] Instruments
        - [x] Counter
        - [x] Gauge
        - [x] Histogram
        - [ ] Summary
    - [x] collect callback
    - [ ] type safety
    - [x] clear/reset
- [x] Support massive amount of metrics
    - [x] Performance
    - [x] Streaming writer
- [x] TTL for metrics
- [x] Dynamic labels
- [x] Default common prefix
- [x] Default labels
- [ ] Internal metrics
    - [ ] Exposure bytes and duration
    - [x] Sample count
        - [x] support deletion
    - [ ] etc.
