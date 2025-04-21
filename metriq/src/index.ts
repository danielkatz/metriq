import { PrometheusExporter, PrometheusExporterImpl } from "./exporters/prometheus-exporter";
import { PrometheusFormatterImpl } from "./exporters/prometheus-formatter";
import { Metrics, MetricsImpl, MetricsOptions } from "./metrics";

export const metriq = (options?: Partial<MetricsOptions>): Metrics => {
    return new MetricsImpl(options);
};

export const prometheusExporter = (metrics: Metrics): PrometheusExporter => {
    if (!(metrics instanceof MetricsImpl)) {
        throw new Error("Metrics must be an instance of MetricsImpl");
    }
    const formatter = new PrometheusFormatterImpl(metrics);
    return new PrometheusExporterImpl(metrics, formatter);
};

export { Labels, RequiredLabels } from "./types";
export { Metrics, MetricsOptions } from "./metrics";
export { Registry, RegistryOptions } from "./registry";
export { InstrumentOptions } from "./instruments/instrument";
export { Counter } from "./instruments/counter";
export { Gauge } from "./instruments/gauge";
export { Histogram, HistogramOptions, HistogramDebugValue } from "./instruments/histogram";
export { Summary, SummaryOptions, SummaryDebugValue } from "./instruments/summary";
export { PrometheusExporter } from "./exporters/prometheus-exporter";
