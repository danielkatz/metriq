import { it, expect, describe } from "vitest";
import { metriq, scrapeHandler } from "metriq";
import { PROMETHEUS_CONTENT_TYPE, OPENMETRICS_CONTENT_TYPE } from "./exporters/prometheus-exporter";
import { consumeStringStream } from "./utils";
import dedent from "dedent";

describe("ScrapeHandler", () => {
    const metrics = metriq();
    const handler = scrapeHandler(metrics);

    describe("content negotiation", () => {
        it("returns Prometheus content type when Accept header is absent", () => {
            const result = handler.scrape();
            expect(result.contentType).toBe(PROMETHEUS_CONTENT_TYPE);
        });

        it("returns Prometheus content type when Accept header is empty", () => {
            const result = handler.scrape("");
            expect(result.contentType).toBe(PROMETHEUS_CONTENT_TYPE);
        });

        it("returns Prometheus format for Accept text/plain", () => {
            const result = handler.scrape("text/plain");
            expect(result.contentType).toBe(PROMETHEUS_CONTENT_TYPE);
        });

        it("returns OpenMetrics format for Accept application/openmetrics-text", () => {
            const result = handler.scrape("application/openmetrics-text; version=1.0.0");
            expect(result.contentType).toBe(OPENMETRICS_CONTENT_TYPE);
        });

        it("returns OpenMetrics format for Accept application/openmetrics-text without version", () => {
            const result = handler.scrape("application/openmetrics-text");
            expect(result.contentType).toBe(OPENMETRICS_CONTENT_TYPE);
        });

        it("returns Prometheus format for Accept */*", () => {
            const result = handler.scrape("*/*");
            expect(result.contentType).toBe(PROMETHEUS_CONTENT_TYPE);
        });
    });

    describe("Prometheus stream output", () => {
        it("returns valid Prometheus format", async () => {
            const m = metriq({ enableInternalMetrics: false });
            m.createCounter("test_counter", "A test counter").increment();
            const h = scrapeHandler(m);
            const result = h.scrape();
            const content = await consumeStringStream(result.stream);
            expect(content).toContain(dedent`
                # HELP test_counter A test counter
                # TYPE test_counter counter
                test_counter 1\n
            `);
            expect(content).not.toContain("# EOF");
        });

        it("stream contains internal metrics when enabled", async () => {
            const result = handler.scrape("text/plain");
            const content = await consumeStringStream(result.stream);
            expect(content).toContain("# TYPE metriq_last_scrape_duration_seconds gauge");
            expect(content).toContain("# TYPE metriq_last_scrape_bytes gauge");
            expect(content).toContain("# TYPE metriq_scrapes_total counter");
        });
    });

    describe("OpenMetrics stream output", () => {
        it("returns valid OpenMetrics format with _total suffix and EOF", async () => {
            const m = metriq({ enableInternalMetrics: false });
            m.createCounter("test_counter", "A test counter").increment();
            const h = scrapeHandler(m);
            const result = h.scrape("application/openmetrics-text");
            expect(result.contentType).toBe(OPENMETRICS_CONTENT_TYPE);
            const content = await consumeStringStream(result.stream);
            expect(content).toContain(dedent`
                # HELP test_counter A test counter
                # TYPE test_counter counter
                test_counter_total 1\n
            `);
            expect(content).toContain("# EOF\n");
            expect(content.trimEnd().endsWith("# EOF")).toBe(true);
        });

        it("gauge has no _total suffix in OpenMetrics", async () => {
            const m = metriq({ enableInternalMetrics: false });
            m.createGauge("test_gauge", "A test gauge").set(42);
            const h = scrapeHandler(m);
            const result = h.scrape("application/openmetrics-text");
            const content = await consumeStringStream(result.stream);
            expect(content).toContain("test_gauge 42");
            expect(content).not.toContain("test_gauge_total");
        });
    });
});
