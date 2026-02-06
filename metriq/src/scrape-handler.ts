import { Readable } from "node:stream";
import { MetricsImpl } from "./metrics";
import { PrometheusExporterImpl, PROMETHEUS_CONTENT_TYPE, OPENMETRICS_CONTENT_TYPE } from "./exporters/prometheus-exporter";
import { PrometheusFormatterImpl } from "./exporters/prometheus-formatter";
import { OpenMetricsFormatterImpl } from "./exporters/openmetrics-formatter";
import { MetricsFormatter } from "./exporters/metrics-formatter";

export interface ScrapeResult {
    contentType: string;
    stream: Readable;
}

export interface ScrapeHandler {
    scrape(acceptHeader?: string): ScrapeResult;
}

function negotiateFormat(acceptHeader?: string): string {
    if (!acceptHeader || acceptHeader.trim() === "") {
        return PROMETHEUS_CONTENT_TYPE;
    }
    if (/application\/openmetrics-text/i.test(acceptHeader)) {
        return OPENMETRICS_CONTENT_TYPE;
    }
    return PROMETHEUS_CONTENT_TYPE;
}

export class ScrapeHandlerImpl implements ScrapeHandler {
    private readonly metrics: MetricsImpl;
    private readonly prometheusFormatter: MetricsFormatter;
    private readonly openMetricsFormatter: MetricsFormatter;

    constructor(metrics: MetricsImpl) {
        this.metrics = metrics;
        this.prometheusFormatter = new PrometheusFormatterImpl(metrics);
        this.openMetricsFormatter = new OpenMetricsFormatterImpl(metrics);
    }

    public scrape(acceptHeader?: string): ScrapeResult {
        const contentType = negotiateFormat(acceptHeader);
        const formatter = contentType === OPENMETRICS_CONTENT_TYPE
            ? this.openMetricsFormatter
            : this.prometheusFormatter;
        const exporter = new PrometheusExporterImpl(this.metrics, formatter, contentType);
        const stream = exporter.generateStream();
        return { contentType, stream };
    }
}
