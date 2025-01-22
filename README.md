# Metriq Monorepo

This monorepo contains the Metriq metrics collection library and related packages.

## TODO

- [ ] The API should be largely compatible with prom-client
    - [ ] Instruments
        - [x] Counter
        - [x] Gauge
        - [x] Histogram
        - [ ] Summary
    - [x] collect callback
    - [x] typed labels
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

## Packages

- [`@metriq/core`](packages/core/README.md) - The core metrics collection and reporting library
- [`@metriq/examples`](packages/examples/README.md) - Example usage and demonstrations

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
