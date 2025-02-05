import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AdapterMetrics, Metrics } from "metriq";
import { MetriqModule } from "./module";
import { METRIQ } from "./constants";
// eslint-disable-next-line import-x/no-unresolved
import { App } from "supertest/types";
import { MetricsController } from "./controller";
import { MetricsService } from "./service";

describe("NestJS adapter", () => {
    let app: INestApplication<App>;
    let server: App;
    let metrics: Metrics;
    let adapterMetrics: AdapterMetrics;

    describe("with default options", () => {
        beforeEach(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [MetriqModule.forRoot()],
                controllers: [MetricsController],
            }).compile();

            app = moduleRef.createNestApplication();
            await app.init();

            server = app.getHttpServer();
            metrics = moduleRef.get<Metrics>(METRIQ);
            adapterMetrics = moduleRef.get<MetricsService>(MetricsService)["adapterMetrics"];
        });

        afterEach(async () => {
            await app.close();
        });

        it("should return metrics in prometheus format with correct content type and status", async () => {
            // Act
            const response = await request(server).get("/metrics");

            // Assert
            expect(response.status).toBe(200);
            expect(response.header["content-type"]).toBe("text/plain; version=0.0.4; charset=utf-8");
            expect(response.text).toContain(adapterMetrics.scrapeDurationGauge!.name);
            expect(response.text).toContain(adapterMetrics.scrapeBytesGauge!.name);
            expect(response.text).toContain(adapterMetrics.scrapeCount!.name);
        });

        it("should update the metrics on scrape", async () => {
            // Act
            const response = await request(server).get("/metrics");

            // Assert
            expect(response.text).toContain(adapterMetrics.scrapeDurationGauge!.name);
            expect(response.text).toContain(adapterMetrics.scrapeBytesGauge!.name);
            expect(response.text).toContain(adapterMetrics.scrapeCount!.name);
            expect(adapterMetrics.scrapeDurationGauge?.getDebugValue({})).not.toBeUndefined();
        });

        it("should count scrapes", async () => {
            // Act
            await request(server).get("/metrics");
            await request(server).get("/metrics");
            await request(server).get("/metrics");

            // Assert
            expect(adapterMetrics.scrapeCount?.getDebugValue({})).toBe(3);
        });

        it("should count bytes scraped", async () => {
            // Act
            const response = await request(server).get("/metrics");

            // Assert
            expect(adapterMetrics.scrapeBytesGauge?.getDebugValue({})).toBe(response.text.length);
        });

        it("should expose custom metrics", async () => {
            // Arrange
            const customMetric = metrics.createCounter("custom_metric", "A custom metric");
            customMetric.increment();

            // Act
            const response = await request(server).get("/metrics");

            // Assert
            expect(response.text).toContain(customMetric.name);
        });
    });

    describe("with custom path", () => {
        beforeEach(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [MetriqModule.forRoot({ metricsPath: "/custom-metrics" })],
                controllers: [MetricsController],
            }).compile();

            app = moduleRef.createNestApplication();
            await app.init();

            server = app.getHttpServer();
            metrics = moduleRef.get<Metrics>(METRIQ);
            adapterMetrics = moduleRef.get<MetricsService>(MetricsService)["adapterMetrics"];
        });

        afterEach(async () => {
            await app.close();
        });

        it("should expose metrics at custom path", async () => {
            // Act & Assert
            await request(server).get("/custom-metrics").expect(200);

            await request(server).get("/metrics").expect(404);
        });
    });

    describe("with internal metrics disabled", () => {
        beforeEach(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [MetriqModule.forRoot({ enableInternalMetrics: false })],
                controllers: [MetricsController],
            }).compile();

            app = moduleRef.createNestApplication();
            await app.init();

            server = app.getHttpServer();
            metrics = moduleRef.get<Metrics>(METRIQ);
            adapterMetrics = moduleRef.get<MetricsService>(MetricsService)["adapterMetrics"];
        });

        afterEach(async () => {
            await app.close();
        });

        it("should not expose internal metrics", async () => {
            // Act
            const response = await request(server).get("/metrics");

            // Assert
            expect(adapterMetrics.scrapeDurationGauge).toBeUndefined();
            expect(adapterMetrics.scrapeBytesGauge).toBeUndefined();
            expect(adapterMetrics.scrapeCount).toBeUndefined();
            expect(response.text).not.toContain("# TYPE metriq_last_scrape_duration_seconds gauge");
            expect(response.text).not.toContain("# TYPE metriq_last_scrape_bytes gauge");
            expect(response.text).not.toContain("# TYPE metriq_scrapes_total counter");
        });
    });
});
