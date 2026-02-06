import { it, expect, describe } from "vitest";
import express from "express";
import request from "supertest";
import { metriq } from "metriq";
import dedent from "dedent";
import { prometheus } from "./express-adapter";

describe("Express adapter", () => {
    it("should return metrics in prometheus format with correct content type and status", async () => {
        // Arrange
        const metrics = metriq();
        const app = express();
        app.get("/metrics", prometheus(metrics));

        const counter = metrics.createCounter("test_counter", "A test counter");
        counter.increment();

        // Act
        const response = await request(app).get("/metrics");

        // Assert
        expect(response.status).toBe(200);
        expect(response.header["content-type"]).toBe("text/plain; version=0.0.4; charset=utf-8");
        expect(response.text).toContain("# TYPE metriq_last_scrape_duration_seconds gauge");
        expect(response.text).toContain("# TYPE metriq_last_scrape_bytes gauge");
        expect(response.text).toContain("# TYPE metriq_scrapes_total counter");
        expect(response.text).toContain(dedent`
            # HELP test_counter A test counter
            # TYPE test_counter counter
            test_counter 1\n
        `);
    });

    it("returns OpenMetrics format when Accept header requests it", async () => {
        const metrics = metriq();
        const app = express();
        app.get("/metrics", prometheus(metrics));

        const response = await request(app)
            .get("/metrics")
            .set("Accept", "application/openmetrics-text; version=1.0.0");

        expect(response.status).toBe(200);
        expect(response.header["content-type"]).toBe("application/openmetrics-text; version=1.0.0; charset=utf-8");
        expect(response.text).toContain("# EOF");
    });
});
