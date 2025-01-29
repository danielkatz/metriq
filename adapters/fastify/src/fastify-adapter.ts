import { Readable, Transform, TransformCallback } from "node:stream";
import { FastifyRequest, FastifyReply } from "fastify";
import { Metrics, PrometheusExporter, AdapterMetrics } from "metriq";

export class FastifyPrometheusAdapter {
    public readonly adapterMetrics: AdapterMetrics;
    private readonly exporter: PrometheusExporter;
    private readonly contentType = "text/plain; version=0.0.4; charset=utf-8";

    constructor(metrics: Metrics, adapterMetrics: AdapterMetrics, exporter: PrometheusExporter) {
        this.adapterMetrics = adapterMetrics;
        this.exporter = exporter;
    }

    public handler = (req: FastifyRequest, res: FastifyReply): FastifyReply => {
        const startTime = Date.now();
        let totalBytes = 0;

        res.type(this.contentType);

        const byteCounter = new Transform({
            transform: (chunk: string | Buffer, encoding: BufferEncoding, callback: TransformCallback) => {
                totalBytes += Buffer.byteLength(chunk, encoding);
                callback(null, chunk);
            },
        });

        const stream = Readable.from(this.exporter.stream()).pipe(byteCounter);

        res.raw.on("finish", () => {
            this.adapterMetrics.onScrape(totalBytes, (Date.now() - startTime) / 1000);
        });

        return res.send(stream);
    };
}
