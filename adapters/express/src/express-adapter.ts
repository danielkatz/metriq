import { pipeline } from "node:stream/promises";
import { Transform, TransformCallback } from "node:stream";
import { Request, Response, NextFunction } from "express";
import { Metrics, PrometheusExporter, AdapterMetrics } from "metriq";

export class ExpressPrometheusAdapter {
    public readonly adapterMetrics: AdapterMetrics;
    private readonly exporter: PrometheusExporter;
    private readonly contentType = "text/plain; version=0.0.4; charset=utf-8";

    constructor(metrics: Metrics, adapterMetrics: AdapterMetrics, exporter: PrometheusExporter) {
        this.adapterMetrics = adapterMetrics;
        this.exporter = exporter;
    }

    public middleware = (req: Request, res: Response, next: NextFunction): void => {
        const startTime = Date.now();
        let totalBytes = 0;

        res.setHeader("Content-Type", this.contentType);

        const byteCounter = new Transform({
            transform: (chunk: string | Buffer, encoding: BufferEncoding, callback: TransformCallback) => {
                totalBytes += Buffer.byteLength(chunk, encoding);
                callback(null, chunk);
            },
        });

        res.on("finish", () => {
            this.adapterMetrics.onScrape(totalBytes, (Date.now() - startTime) / 1000);
        });

        pipeline(this.exporter.stream(), byteCounter, res)
            .then(() => {
                res.end();
            })
            .catch(next);
    };
}
