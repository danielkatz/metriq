export interface MetricsFormatter {
    writeMetrics(): AsyncGenerator<string>;
}
