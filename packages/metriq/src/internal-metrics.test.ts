import { describe, it, expect, beforeEach } from "vitest";
import { MetricsImpl } from "./metrics";
import { InternalMetricsImpl } from "./internal-metrics";

describe("InternalMetrics", () => {
    let metriq: MetricsImpl;
    let internalMetrics: InternalMetricsImpl;

    beforeEach(() => {
        metriq = new MetricsImpl();
        internalMetrics = metriq["internalMetrics"] as InternalMetricsImpl;
    });

    describe("metricGauge", () => {
        let baseCount: number;

        beforeEach(() => {
            baseCount = internalMetrics.metricGauge.getValue({})!;
        });

        it("internal metrics should be counted as well", () => {
            expect(baseCount).toBe(3);
        });

        it("should count metrics", () => {
            // Act
            metriq.createCounter("counter", "Counter");

            // Assert
            expect(internalMetrics.metricGauge.getValue({})).toBe(baseCount + 1);
        });

        it("should count multivariate metrics as one", () => {
            // Act
            metriq.createHistogram("histogram", "Histogram", { buckets: [1, 2, 3] });

            // Assert
            expect(internalMetrics.metricGauge.getValue({})).toBe(baseCount + 1);
        });

        it("should count metric with multiple timeseries as one", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment({ a: "1" });
            counter.increment({ a: "2" });

            // Assert
            expect(internalMetrics.metricGauge.getValue({})).toBe(baseCount + 1);
        });
    });

    describe("timeseriesGauge", () => {
        it("should count timeseries", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment({ a: "1" });

            // Assert
            expect(internalMetrics.timeseriesGauge.getValue({ instrument: "counter" })).toBe(1);
        });

        it("should count multivariate metrics as one", () => {
            // Arrange
            const histogram = metriq.createHistogram("histogram", "Histogram", { buckets: [1, 2, 3] });

            // Act
            histogram.observe(1);

            // Assert
            expect(internalMetrics.timeseriesGauge.getValue({ instrument: "histogram" })).toBe(1);
        });

        it("should decrease count when timeseries is removed", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment({ a: "1" });
            counter.increment({ a: "2" });
            counter.remove({ a: "1" });

            // Assert
            expect(internalMetrics.timeseriesGauge.getValue({ instrument: "counter" })).toBe(1);
        });

        it("should reset count when metric is cleared", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment();
            counter.increment({ a: "1" });
            counter.increment({ a: "2" });
            counter.clear();

            // Assert
            expect(internalMetrics.timeseriesGauge.getValue({ instrument: "counter" })).toBe(0);
        });
    });

    describe("sampleGauge", () => {
        it("should count samples", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment({ a: "1" });

            // Assert
            expect(internalMetrics.sampleGauge.getValue({ instrument: "counter" })).toBe(1);
        });

        it("should count multivariate metrics as many", () => {
            // Arrange
            const histogram = metriq.createHistogram("histogram", "Histogram", { buckets: [1, 2, 3] });

            // Act
            histogram.observe(1);

            // Assert
            expect(internalMetrics.sampleGauge.getValue({ instrument: "histogram" })).toBe(5);
        });

        it("should decrease count when timeseries is removed", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment({ a: "1" });
            counter.increment({ a: "2" });
            counter.remove({ a: "1" });

            // Assert
            expect(internalMetrics.sampleGauge.getValue({ instrument: "counter" })).toBe(1);
        });

        it("should reset count when counter is cleared", () => {
            // Arrange
            const counter = metriq.createCounter("counter", "Counter");

            // Act
            counter.increment();
            counter.increment({ a: "1" });
            counter.increment({ a: "2" });
            counter.clear();

            // Assert
            expect(internalMetrics.sampleGauge.getValue({ instrument: "counter" })).toBe(0);
        });

        it("should reset count when histogram is cleared", () => {
            // Arrange
            const histogram = metriq.createHistogram("histogram", "Histogram", { buckets: [1, 2, 3] });

            // Act
            histogram.observe(1);
            histogram.observe({ a: "1" }, 2);
            histogram.observe({ a: "2" }, 3);
            histogram.clear();

            // Assert
            expect(internalMetrics.sampleGauge.getValue({ instrument: "histogram" })).toBe(0);
        });
    });
});
