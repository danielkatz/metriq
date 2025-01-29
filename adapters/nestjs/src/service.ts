import { Readable, Transform, TransformCallback } from "node:stream";
import { Injectable, StreamableFile } from "@nestjs/common";
import { AdapterMetrics, Metrics, PrometheusExporter, prometheusExporter } from "metriq";
import { InjectMetriq } from "./decorators";

@Injectable()
export class MetricsService {
    private readonly exporter: PrometheusExporter;
    private readonly adapterMetrics: AdapterMetrics;

    constructor(@InjectMetriq() private readonly metrics: Metrics) {
        this.exporter = prometheusExporter(this.metrics);
        this.adapterMetrics = this.metrics.createAdapter((metrics, builtinMetrics) => builtinMetrics);
    }

    getMetrics(): StreamableFile {
        const startTime = Date.now();
        let totalBytes = 0;

        const byteCounter = new Transform({
            transform: (chunk: string | Buffer, encoding: BufferEncoding, callback: TransformCallback) => {
                totalBytes += Buffer.byteLength(chunk, encoding);
                callback(null, chunk);
            },
        });

        const stream = Readable.from(this.exporter.stream()).pipe(byteCounter);
        const streamable = new StreamableFile(stream, {
            type: "text/plain; version=0.0.4; charset=utf-8",
        });

        streamable.getStream().on("finish", () => {
            this.adapterMetrics.onScrape(totalBytes, (Date.now() - startTime) / 1000);
        });

        return streamable;
    }
}
