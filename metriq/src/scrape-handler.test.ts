import { it, expect, describe, beforeEach } from "vitest";
import { metriq, scrapeHandler } from "metriq";
import { PROMETHEUS_CONTENT_TYPE } from "./exporters/prometheus-exporter";
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

        it("returns Prometheus format for Accept application/openmetrics-text (fallback)", () => {
            const result = handler.scrape("application/openmetrics-text; version=1.0.0");
            expect(result.contentType).toBe(PROMETHEUS_CONTENT_TYPE);
        });

        it("returns Prometheus format for Accept */*", () => {
            const result = handler.scrape("*/*");
            expect(result.contentType).toBe(PROMETHEUS_CONTENT_TYPE);
        });
    });

    describe("stream output", () => {
        it("returns a valid stream with metric content", async () => {
            const m = metriq();
            m.createCounter("test_counter", "A test counter").increment();
            const h = scrapeHandler(m);
            const result = h.scrape();
            expect(result.stream).toBeDefined();
            const content = await consumeStringStream(result.stream);
            expect(content.length).toBeGreaterThan(0);
            expect(content).toContain("# TYPE test_counter counter");
            expect(content).toContain(dedent`
                # HELP test_counter A test counter
                # TYPE test_counter counter
                test_counter 1\n
            `);
        });

        it("stream contains internal metrics when enabled", async () => {
            const result = handler.scrape("text/plain");
            const content = await consumeStringStream(result.stream);
            expect(content).toContain("# TYPE metriq_last_scrape_duration_seconds gauge");
            expect(content).toContain("# TYPE metriq_last_scrape_bytes gauge");
            expect(content).toContain("# TYPE metriq_scrapes_total counter");
        });
    });
});
