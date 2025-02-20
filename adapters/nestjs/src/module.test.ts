import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import dedent from "dedent";
import { Metrics } from "metriq";
import { MetriqModule } from "./module";
import { METRIQ } from "./constants";
import { App } from "supertest/types";
import { MetricsController } from "./controller";

describe("NestJS adapter", () => {
    let app: INestApplication<App>;
    let server: App;
    let metrics: Metrics;

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
        });

        afterEach(async () => {
            await app.close();
        });

        it("should return metrics in prometheus format with correct content type and status", async () => {
            // Arrange
            const counter = metrics.createCounter("test_counter", "A test counter");
            counter.increment();

            // Act
            const response = await request(server).get("/metrics");

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
});
