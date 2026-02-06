import { Readable, Transform, TransformCallback, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Buffer } from "node:buffer";
import { MetricsImpl } from "../metrics";
import { MetricsFormatter } from "./metrics-formatter";

export const PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8";
export const OPENMETRICS_CONTENT_TYPE = "application/openmetrics-text; version=1.0.0; charset=utf-8";

export interface PrometheusExporter {
    contentType: string;
    generateStream(): Readable;
    writeToStream(stream: Writable): Promise<void>;
}

export class PrometheusExporterImpl implements PrometheusExporter {
    private readonly metrics: MetricsImpl;
    private readonly formatter: MetricsFormatter;
    public readonly contentType: string;

    constructor(metrics: MetricsImpl, formatter: MetricsFormatter, contentType: string = PROMETHEUS_CONTENT_TYPE) {
        this.metrics = metrics;
        this.formatter = formatter;
        this.contentType = contentType;
    }

    public generateStream(): Readable {
        const startTime = Date.now();
        let totalBytes = 0;

        const byteCounter = new Transform({
            transform: (chunk: string, encoding: BufferEncoding, callback: TransformCallback) => {
                totalBytes += Buffer.byteLength(chunk, encoding);
                callback(null, chunk);
            },
        });

        const stream = Readable.from(this.formatter.writeMetrics()).pipe(byteCounter);

        stream.on("finish", () => {
            this.metrics.internalMetrics.onScrape(totalBytes, (Date.now() - startTime) / 1000);
        });

        return stream;
    }

    public async writeToStream(stream: Writable): Promise<void> {
        await pipeline(this.generateStream(), stream);
    }
}
