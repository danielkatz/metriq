import { it, expect, describe, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { Metrics, metriq, prometheusExporter, PrometheusExporter } from "metriq";
import { ExpressPrometheusAdapter } from "./express-adapter";

describe("Express adapter", () => {
    let metrics: Metrics;
    let app: express.Application;
    let exporter: PrometheusExporter;
    let adapter: ExpressPrometheusAdapter;

    describe("with default options", () => {
        beforeEach(() => {
            metrics = metriq();
            app = express();
            exporter = prometheusExporter(metrics);
            adapter = metrics.createAdapter(
                (metrics, adapterMetrics) => new ExpressPrometheusAdapter(metrics, adapterMetrics, exporter),
            );

            app.get("/metrics", adapter.middleware);
        });

        it("should return metrics in prometheus format with correct content type and status", async () => {
            // Act
            const response = await request(app).get("/metrics");

            // Assert
            expect(response.status).toBe(200);
            expect(response.header["content-type"]).toBe("text/plain; version=0.0.4; charset=utf-8");
            expect(response.text).toContain(adapter.adapterMetrics.scrapeDurationGauge!.name);
            expect(response.text).toContain(adapter.adapterMetrics.scrapeBytesGauge!.name);
            expect(response.text).toContain(adapter.adapterMetrics.scrapeCount!.name);
        });

        it("should update the metrics on scrape", async () => {
            // Act
            const response = await request(app).get("/metrics");

            // Assert
            expect(response.text.length).toBeGreaterThan(0);
            expect(adapter.adapterMetrics.scrapeCount?.getDebugValue({})).toBe(1);
            expect(adapter.adapterMetrics.scrapeBytesGauge?.getDebugValue({})).toBeGreaterThan(0);
            expect(adapter.adapterMetrics.scrapeDurationGauge?.getDebugValue({})).not.toBeUndefined();
        });

        it("should count scrapes", async () => {
            // Act
            await request(app).get("/metrics");
            await request(app).get("/metrics");
            await request(app).get("/metrics");

            // Assert
            expect(adapter.adapterMetrics.scrapeCount?.getDebugValue({})).toBe(3);
        });

        it("should count bytes scraped", async () => {
            // Act
            const response = await request(app).get("/metrics");

            // Assert
            expect(adapter.adapterMetrics.scrapeBytesGauge?.getDebugValue({})).toBe(response.text.length);
        });

        it("should expose custom metrics", async () => {
            // Act
            const customMetric = metrics.createCounter("custom_metric", "A custom metric");
            const response = await request(app).get("/metrics");

            // Assert
            expect(response.text).toContain(customMetric.name);
        });
    });

    describe("with internal metrics disabled", () => {
        beforeEach(() => {
            metrics = metriq({ enableInternalMetrics: false });
            app = express();
            exporter = prometheusExporter(metrics);
            adapter = metrics.createAdapter(
                (metrics, adapterMetrics) => new ExpressPrometheusAdapter(metrics, adapterMetrics, exporter),
            );

            app.get("/metrics", adapter.middleware);
        });

        it("should not expose internal metrics", async () => {
            // Act
            const response = await request(app).get("/metrics");

            // Assert
            expect(adapter.adapterMetrics.scrapeDurationGauge).toBeUndefined();
            expect(adapter.adapterMetrics.scrapeBytesGauge).toBeUndefined();
            expect(adapter.adapterMetrics.scrapeCount).toBeUndefined();
            expect(response.text).not.toContain("# TYPE metriq_last_scrape_duration_seconds gauge");
            expect(response.text).not.toContain("# TYPE metriq_last_scrape_bytes gauge");
            expect(response.text).not.toContain("# TYPE metriq_scrapes_total counter");
        });
    });
});
