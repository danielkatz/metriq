import { it, expect, describe, beforeEach } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import { Metrics, metriq, prometheusExporter, PrometheusExporter } from "metriq";
import { FastifyPrometheusAdapter } from "./fastify-adapter";

describe("Fastify adapter", () => {
    let metrics: Metrics;
    let app: FastifyInstance;
    let exporter: PrometheusExporter;
    let adapter: FastifyPrometheusAdapter;

    describe("with default options", () => {
        beforeEach(() => {
            metrics = metriq();
            app = Fastify();
            exporter = prometheusExporter(metrics);
            adapter = metrics.createAdapter(
                (metrics, adapterMetrics) => new FastifyPrometheusAdapter(metrics, adapterMetrics, exporter),
            );

            app.get("/metrics", adapter.handler);
        });

        it("should return metrics in prometheus format with correct content type and status", async () => {
            // Act
            const response = await app.inject({
                method: "GET",
                url: "/metrics",
            });

            // Assert
            expect(response.headers["content-type"]).toBe("text/plain; version=0.0.4; charset=utf-8");
            expect(response.statusCode).toBe(200);
            expect(response.body).toContain(adapter.adapterMetrics.scrapeDurationGauge!.name);
            expect(response.body).toContain(adapter.adapterMetrics.scrapeBytesGauge!.name);
            expect(response.body).toContain(adapter.adapterMetrics.scrapeCount!.name);
        });

        it("should update the metrics on scrape", async () => {
            // Act
            const response = await app.inject({
                method: "GET",
                url: "/metrics",
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toBe("text/plain; version=0.0.4; charset=utf-8");
            expect(response.body).toContain(adapter.adapterMetrics.scrapeDurationGauge!.name);
            expect(response.body).toContain(adapter.adapterMetrics.scrapeBytesGauge!.name);
            expect(response.body).toContain(adapter.adapterMetrics.scrapeCount!.name);
            expect(adapter.adapterMetrics.scrapeDurationGauge?.getDebugValue({})).not.toBeUndefined();
        });

        it("should count scrapes", async () => {
            // Act
            await app.inject({
                method: "GET",
                url: "/metrics",
            });
            await app.inject({
                method: "GET",
                url: "/metrics",
            });
            await app.inject({
                method: "GET",
                url: "/metrics",
            });

            // Assert
            expect(adapter.adapterMetrics.scrapeCount?.getDebugValue({})).toBe(3);
        });

        it("should count bytes scraped", async () => {
            // Act
            const response = await app.inject({
                method: "GET",
                url: "/metrics",
            });

            // Assert
            expect(adapter.adapterMetrics.scrapeBytesGauge?.getDebugValue({})).toBe(response.body.length);
        });

        it("should expose custom metrics", async () => {
            // Act
            const customMetric = metrics.createCounter("custom_metric", "A custom metric");
            const response = await app.inject({
                method: "GET",
                url: "/metrics",
            });

            // Assert
            expect(response.body).toContain(customMetric.name);
        });
    });

    describe("with internal metrics disabled", () => {
        beforeEach(() => {
            metrics = metriq({ enableInternalMetrics: false });
            app = Fastify();
            exporter = prometheusExporter(metrics);
            adapter = metrics.createAdapter(
                (metrics, adapterMetrics) => new FastifyPrometheusAdapter(metrics, adapterMetrics, exporter),
            );

            app.get("/metrics", adapter.handler);
        });

        it("should not expose internal metrics", async () => {
            // Act
            const response = await app.inject({
                method: "GET",
                url: "/metrics",
            });

            // Assert
            expect(adapter.adapterMetrics.scrapeDurationGauge).toBeUndefined();
            expect(adapter.adapterMetrics.scrapeBytesGauge).toBeUndefined();
            expect(adapter.adapterMetrics.scrapeCount).toBeUndefined();
            expect(response.body).not.toContain("# TYPE metriq_last_scrape_duration_seconds gauge");
            expect(response.body).not.toContain("# TYPE metriq_last_scrape_bytes gauge");
            expect(response.body).not.toContain("# TYPE metriq_scrapes_total counter");
        });
    });
});
