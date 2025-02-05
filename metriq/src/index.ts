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

export { Labels, RequiredLabels } from "./types";
export { Metrics, MetricsOptions } from "./metrics";
export { Registry, RegistryOptions } from "./registry";
export { InstrumentOptions } from "./instruments/instrument";
export { Counter } from "./instruments/counter";
export { Gauge } from "./instruments/gauge";
export { Histogram, HistogramOptions } from "./instruments/histogram";
export { PrometheusExporter } from "./exporters/prometheus";
export { AdapterMetrics } from "./internal-metrics";
