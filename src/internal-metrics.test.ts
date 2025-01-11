import { describe, it, expect, beforeEach } from "vitest";
import { Metrics } from "./metrics";
import { InternalMetricsImpl } from "./internal-metrics";

describe("InternalMetrics", () => {
    let metriq: Metrics;
    let internalMetrics: InternalMetricsImpl;

    beforeEach(() => {
        metriq = new Metrics();
        internalMetrics = metriq["internalMetrics"] as InternalMetricsImpl;
    });

    describe("metricCounter", () => {
        let baseCount: number;

        beforeEach(() => {
            baseCount = internalMetrics.metricCounter.getValue({})!;
        });

        it("internal metrics should be counted as well", () => {
            expect(baseCount).toBe(3);
        });

        it("should count metrics", () => {
            // Act
            metriq.createCounter("counter", "Counter");

            // Assert
            expect(internalMetrics.metricCounter.getValue({})).toBe(baseCount + 1);
        });

        it("should count multivariate metrics as one", () => {
            // Act
            metriq.createHistogram("histogram", "Histogram", { buckets: [1, 2, 3] });

            // Assert
            expect(internalMetrics.metricCounter.getValue({})).toBe(baseCount + 1);
        });

        it("should count metric with multiple timeseries as one", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment({ a: "1" });
            counter.increment({ a: "2" });

            // Assert
            expect(internalMetrics.metricCounter.getValue({})).toBe(baseCount + 1);
        });
    });

    describe("timeseriesCounter", () => {
        it("should count timeseries", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment({ a: "1" });

            // Assert
            expect(internalMetrics.timeseriesCounter.getValue({ instrument: "counter" })).toBe(1);
        });

        it("should count multivariate metrics as one", () => {
            // Arrange
            const histogram = metriq.createHistogram("histogram", "Histogram", { buckets: [1, 2, 3] });

            // Act
            histogram.observe(1);

            // Assert
            expect(internalMetrics.timeseriesCounter.getValue({ instrument: "histogram" })).toBe(1);
        });
    });

    describe("sampleCounter", () => {
        it("should count samples", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment({ a: "1" });

            // Assert
            expect(internalMetrics.sampleCounter.getValue({ instrument: "counter" })).toBe(1);
        });

        it("should count multivariate metrics as many", () => {
            // Arrange
            const histogram = metriq.createHistogram("histogram", "Histogram", { buckets: [1, 2, 3] });

            // Act
            histogram.observe(1);

            // Assert
            expect(internalMetrics.sampleCounter.getValue({ instrument: "histogram" })).toBe(5);
        });
    });
});
