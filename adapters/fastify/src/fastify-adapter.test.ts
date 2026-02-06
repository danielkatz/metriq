import { it, expect, describe } from "vitest";
import Fastify from "fastify";
import dedent from "dedent";
import { metriq } from "metriq";
import { prometheus } from "./fastify-adapter";

describe("Fastify adapter", () => {
    it("should return metrics in prometheus format with correct content type and status", async () => {
        // Arrange
        const metrics = metriq();
        const app = Fastify();
        app.get("/metrics", prometheus(metrics));

        const counter = metrics.createCounter("test_counter", "A test counter");
        counter.increment();

        // Act
        const response = await app.inject({ method: "GET", url: "/metrics" });

        // Assert
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toBe("text/plain; version=0.0.4; charset=utf-8");
        expect(response.body).toContain("# TYPE metriq_last_scrape_duration_seconds gauge");
        expect(response.body).toContain("# TYPE metriq_last_scrape_bytes gauge");
        expect(response.body).toContain("# TYPE metriq_scrapes_total counter");
        expect(response.body).toContain(dedent`
            # HELP test_counter A test counter
            # TYPE test_counter counter
            test_counter 1\n
        `);
    });

    it("forwards Accept header for content negotiation", async () => {
        const metrics = metriq();
        const app = Fastify();
        app.get("/metrics", prometheus(metrics));

        const response = await app.inject({
            method: "GET",
            url: "/metrics",
            headers: { accept: "application/openmetrics-text; version=1.0.0" },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toBe("text/plain; version=0.0.4; charset=utf-8");
    });
});
