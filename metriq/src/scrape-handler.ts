import { Readable } from "node:stream";
import { MetricsImpl } from "./metrics";
import { PrometheusExporterImpl } from "./exporters/prometheus-exporter";
import { PrometheusFormatterImpl } from "./exporters/prometheus-formatter";
import { PROMETHEUS_CONTENT_TYPE } from "./exporters/prometheus-exporter";

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
    const prefersOpenMetrics = /application\/openmetrics-text/i.test(acceptHeader);
    if (prefersOpenMetrics) {
        return PROMETHEUS_CONTENT_TYPE;
    }
    return PROMETHEUS_CONTENT_TYPE;
}

export class ScrapeHandlerImpl implements ScrapeHandler {
    private readonly exporter: PrometheusExporterImpl;

    constructor(metrics: MetricsImpl) {
        const formatter = new PrometheusFormatterImpl(metrics);
        this.exporter = new PrometheusExporterImpl(metrics, formatter);
    }

    public scrape(acceptHeader?: string): ScrapeResult {
        const contentType = negotiateFormat(acceptHeader);
        const stream = this.exporter.generateStream();
        return { contentType, stream };
    }
}
