# metriq

## 0.6.0

### Minor Changes

- 7068fef: Add OpenMetrics text format exporter with automatic content negotiation. When a scrape client sends `Accept: application/openmetrics-text`, the response uses OpenMetrics format (counter `_total` suffix, `# EOF` terminator). Default remains Prometheus text format. New exports: `MetricsFormatter` interface.
- 7068fef: Move protocol negotiation (Accept header) into core via `scrapeHandler`. Core is now usable standalone; adapters are thin "last mile" wrappers. New exports: `scrapeHandler(metrics)`, `ScrapeHandler`, `ScrapeResult`.

## 0.5.0

### Minor Changes

- 46e1c0a: Encode help string

## 0.4.0

### Minor Changes

- 9e4d7c9: Properly encode values in prometheus text formatter

## 0.3.1

### Patch Changes

- d963ca7: A bit of refactoring

## 0.3.0

### Minor Changes

- 471519f: Simplified adaper implementation

## 0.2.2

### Patch Changes

- 01f4311: Add npmrc

## 0.2.1

### Patch Changes

- 3e19c7d: Publish Scoped Packages

## 0.2.0

### Minor Changes

- eb08ef5: Initial release
