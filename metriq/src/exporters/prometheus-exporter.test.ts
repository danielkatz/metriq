import { it, expect, describe, beforeEach } from "vitest";
import { Buffer } from "node:buffer";
import { metriq, prometheusExporter } from "metriq";
import { PrometheusExporter } from "./prometheus-exporter";
import { MetricsImpl } from "../metrics";
import { InternalMetricsImpl } from "../internal-metrics";
import { consumeStringStream } from "../utils";
import { PassThrough } from "node:stream";

describe("Prometheus exporter", () => {
    let metrics: MetricsImpl;
    let internalMetrics: InternalMetricsImpl;
    let exporter: PrometheusExporter;

    describe("with default options", () => {
        beforeEach(() => {
            metrics = metriq() as MetricsImpl;
            internalMetrics = metrics.internalMetrics as InternalMetricsImpl;
            exporter = prometheusExporter(metrics);
        });

        it("should return metrics in prometheus format with correct content type and status", async () => {
            // Act
            const stream = exporter.generateStream();
            const content = await consumeStringStream(stream);

            // Assert
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain(internalMetrics.scrapeDurationGauge.name);
            expect(content).toContain(internalMetrics.scrapeBytesGauge.name);
            expect(content).toContain(internalMetrics.scrapeCount.name);
            expect(exporter.contentType).toBe("text/plain; version=0.0.4; charset=utf-8");
        });

        it("should update the metrics on scrape", async () => {
            // Act
            const stream = exporter.generateStream();
            const content = await consumeStringStream(stream);

            // Assert
            expect(content.length).toBeGreaterThan(0);
            expect(internalMetrics.scrapeCount.getDebugValue({})).toBe(1);
            expect(internalMetrics.scrapeBytesGauge.getDebugValue({})).toBeGreaterThan(0);
            expect(internalMetrics.scrapeDurationGauge.getDebugValue({})).not.toBeUndefined();
        });

        it("should count scrapes", async () => {
            // Act
            await consumeStringStream(exporter.generateStream());
            await consumeStringStream(exporter.generateStream());
            await consumeStringStream(exporter.generateStream());

            // Assert
            expect(internalMetrics.scrapeCount.getDebugValue({})).toBe(3);
        });

        it("should count bytes scraped", async () => {
            // Act
            const stream = exporter.generateStream();
            const content = await consumeStringStream(stream);

            // Assert
            const totalBytes = Buffer.byteLength(content);
            expect(totalBytes).toBeGreaterThan(0);
            expect(internalMetrics.scrapeBytesGauge.getDebugValue({})).toBe(totalBytes);
        });

        it("should expose custom metrics", async () => {
            // Act
            const customMetric = metrics.createCounter("custom_metric", "A custom metric");
            const stream = exporter.generateStream();
            const content = await consumeStringStream(stream);

            // Assert
            expect(content).toContain(customMetric.name);
        });

        it("writeToStream should write to stream", async () => {
            // Act
            const stream = new PassThrough();
            await exporter.writeToStream(stream);
            const content = await consumeStringStream(stream);

            // Assert
            const totalBytes = Buffer.byteLength(content);
            expect(totalBytes).toBeGreaterThan(0);
            expect(internalMetrics.scrapeBytesGauge.getDebugValue({})).toBe(totalBytes);
            expect(content).toContain(internalMetrics.scrapeDurationGauge.name);
            expect(content).toContain(internalMetrics.scrapeBytesGauge.name);
            expect(content).toContain(internalMetrics.scrapeCount.name);
        });
    });

    describe("with internal metrics disabled", () => {
        beforeEach(() => {
            metrics = metriq({ enableInternalMetrics: false }) as MetricsImpl;
            internalMetrics = metrics.internalMetrics as InternalMetricsImpl;
            exporter = prometheusExporter(metrics);
        });

        it("should not expose internal metrics", async () => {
            // Act
            const stream = exporter.generateStream();
            const content = await consumeStringStream(stream);

            // Assert
            expect(internalMetrics.scrapeDurationGauge).toBeUndefined();
            expect(internalMetrics.scrapeBytesGauge).toBeUndefined();
            expect(internalMetrics.scrapeCount).toBeUndefined();
            expect(content).not.toContain("# TYPE metriq_last_scrape_duration_seconds gauge");
            expect(content).not.toContain("# TYPE metriq_last_scrape_bytes gauge");
            expect(content).not.toContain("# TYPE metriq_scrapes_total counter");
        });
    });
});
