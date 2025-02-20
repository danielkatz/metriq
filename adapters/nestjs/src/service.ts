import { Injectable, StreamableFile } from "@nestjs/common";
import { Metrics, PrometheusExporter, prometheusExporter } from "metriq";
import { InjectMetriq } from "./decorators";

@Injectable()
export class MetricsService {
    private readonly exporter: PrometheusExporter;

    constructor(@InjectMetriq() private readonly metrics: Metrics) {
        this.exporter = prometheusExporter(this.metrics);
    }

    getMetrics(): StreamableFile {
        const stream = this.exporter.generateStream();
        const streamable = new StreamableFile(stream, {
            type: this.exporter.contentType,
        });

        return streamable;
    }
}
