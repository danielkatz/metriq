import { PrometheusExporter, PrometheusExporterImpl } from "./exporters/prometheus";
import { Metrics, MetricsImpl, MetricsOptions } from "./metrics";

export const metriq = (options?: Partial<MetricsOptions>): Metrics => {
    return new MetricsImpl(options);
};

export const prometheusExporter = (metrics: Metrics): PrometheusExporter => {
    if (!(metrics instanceof MetricsImpl)) {
        throw new Error("Metrics must be an instance of MetricsImpl");
    }
    return new PrometheusExporterImpl(metrics);
};

export { Metrics } from "./metrics";
export { Registry } from "./registry";
export { Counter } from "./instruments/counter";
export { Gauge } from "./instruments/gauge";
export { Histogram } from "./instruments/histogram";
export { PrometheusExporter } from "./exporters/prometheus";
