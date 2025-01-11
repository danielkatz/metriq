import { describe, it, expect, beforeEach } from "vitest";
import dedent from "dedent";
import { Metrics } from "../metrics";
import { PrometheusExporter } from "./prometheus";
import { readStreamToString } from "../utils";

describe("PrometheusExporter", () => {
    describe("single registry", () => {
        let metrics: Metrics;
        let exporter: PrometheusExporter;

        beforeEach(() => {
            metrics = new Metrics({ enableInternalMetrics: false });
            exporter = new PrometheusExporter(metrics);
        });

        it("empty state", async () => {
            // Arrange
            // Act
            const stream = exporter.stream();
            const result = await readStreamToString(stream);

            // Assert
            expect(result).toBe("");
        });

        describe("counter", () => {
            it("empty state", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter\n
                `);
            });

            it("single counter with no labels", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter 5\n
                `);
            });

            it("single counter with a label", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key: "value" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key="value"} 5\n
                `);
            });

            it("single counter with multiple labels", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key1: "value1", key2: "value2" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key1="value1",key2="value2"} 5\n
                `);
            });

            it("single counter with multiple label values", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key: "value1" }, 5);
                counter.increment({ key: "value2" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key="value1"} 5
                    counter{key="value2"} 7\n
                `);
            });

            it("single counter with multiple label keys", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key1: "value1", key2: "value2" }, 5);
                counter.increment({ key1: "value3", key2: "value4" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key1="value1",key2="value2"} 5
                    counter{key1="value3",key2="value4"} 7\n
                `);
            });

            it("multiple counters with no labels", async () => {
                // Arrange
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");

                counter1.increment(5);
                counter2.increment(7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE counter
                    counter1 5

                    # HELP description2
                    # TYPE counter
                    counter2 7\n
                `);
            });

            it("multiple counters with same labels and same label value", async () => {
                // Arrange
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");

                counter1.increment({ key: "value" }, 5);
                counter2.increment({ key: "value" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE counter
                    counter1{key="value"} 5

                    # HELP description2
                    # TYPE counter
                    counter2{key="value"} 7\n
                `);
            });

            it("multiple counters with same labels and different label values", async () => {
                // Arrange
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");

                counter1.increment({ key: "value1" }, 5);
                counter2.increment({ key: "value2" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE counter
                    counter1{key="value1"} 5

                    # HELP description2
                    # TYPE counter
                    counter2{key="value2"} 7\n
                `);
            });

            it("counter with prefix", async () => {
                // Arrange
                const registry = metrics.createRegistry({ commonPrefix: "prefix_" });
                const instrument = registry.createCounter("counter", "description");

                instrument.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    prefix_counter 5\n
                `);
            });

            it("counter with common labels", async () => {
                // Arrange
                const metrics = new Metrics({ commonLabels: { key: "value" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporter(metrics);

                const counter = metrics.createCounter("counter", "description");

                counter.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key="value"} 5\n
                `);
            });

            it("counter with common labels and instrument labels", async () => {
                // Arrange
                const metrics = new Metrics({ commonLabels: { key1: "value1" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporter(metrics);

                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key2: "value2" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key1="value1",key2="value2"} 5\n
                `);
            });
        });

        describe("gauge", () => {
            it("empty state", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge\n
                `);
            });

            it("single gauge with no labels", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge
                    gauge 5\n
                `);
            });

            it("single gauge with a label", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment({ key: "value" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge
                    gauge{key="value"} 5\n
                `);
            });

            it("single gauge with multiple labels", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment({ key1: "value1", key2: "value2" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge
                    gauge{key1="value1",key2="value2"} 5\n
                `);
            });

            it("single gauge with multiple label values", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment({ key: "value1" }, 5);
                gauge.increment({ key: "value2" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge
                    gauge{key="value1"} 5
                    gauge{key="value2"} 7\n
                `);
            });

            it("single gauge with multiple label keys", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment({ key1: "value1", key2: "value2" }, 5);
                gauge.increment({ key1: "value3", key2: "value4" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge
                    gauge{key1="value1",key2="value2"} 5
                    gauge{key1="value3",key2="value4"} 7\n
                `);
            });

            it("multiple gauges with no labels", async () => {
                // Arrange
                const gauge1 = metrics.createGauge("gauge1", "description1");
                const gauge2 = metrics.createGauge("gauge2", "description2");

                gauge1.increment(5);
                gauge2.increment(7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE gauge
                    gauge1 5

                    # HELP description2
                    # TYPE gauge
                    gauge2 7\n
                `);
            });

            it("multiple gauges with same labels and same label value", async () => {
                // Arrange
                const gauge1 = metrics.createGauge("gauge1", "description1");
                const gauge2 = metrics.createGauge("gauge2", "description2");

                gauge1.increment({ key: "value" }, 5);
                gauge2.increment({ key: "value" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE gauge
                    gauge1{key="value"} 5

                    # HELP description2
                    # TYPE gauge
                    gauge2{key="value"} 7\n
                `);
            });

            it("multiple gauges with same labels and different label values", async () => {
                // Arrange
                const gauge1 = metrics.createGauge("gauge1", "description1");
                const gauge2 = metrics.createGauge("gauge2", "description2");

                gauge1.increment({ key: "value1" }, 5);
                gauge2.increment({ key: "value2" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE gauge
                    gauge1{key="value1"} 5

                    # HELP description2
                    # TYPE gauge
                    gauge2{key="value2"} 7\n
                `);
            });

            it("gauge with prefix", async () => {
                // Arrange
                const registry = metrics.createRegistry({ commonPrefix: "prefix_" });
                const instrument = registry.createGauge("gauge", "description");

                instrument.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge
                    prefix_gauge 5\n
                `);
            });

            it("gauge with common labels", async () => {
                // Arrange
                const metrics = new Metrics({ commonLabels: { key: "value" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporter(metrics);

                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge
                    gauge{key="value"} 5\n
                `);
            });

            it("gauge with common labels and instrument labels", async () => {
                // Arrange
                const metrics = new Metrics({ commonLabels: { key1: "value1" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporter(metrics);

                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment({ key2: "value2" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE gauge
                    gauge{key1="value1",key2="value2"} 5\n
                `);
            });
        });

        describe("histogram", () => {
            it("empty state", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE histogram\n
                `);
            });

            it("single histogram with no labels", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe(1.5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE histogram
                    histogram_bucket{le="1"} 0
                    histogram_bucket{le="2"} 1
                    histogram_bucket{le="3"} 1
                    histogram_bucket{le="+Inf"} 1
                    histogram_sum 1.5
                    histogram_count 1\n
                `);
            });

            it("single histogram with labels", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ method: "GET" }, 1.5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE histogram
                    histogram_bucket{method="GET",le="1"} 0
                    histogram_bucket{method="GET",le="2"} 1
                    histogram_bucket{method="GET",le="3"} 1
                    histogram_bucket{method="GET",le="+Inf"} 1
                    histogram_sum{method="GET"} 1.5
                    histogram_count{method="GET"} 1\n
                `);
            });

            it("single histogram with multiple observations", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe(0.5);
                histogram.observe(1.5);
                histogram.observe(2.5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE histogram
                    histogram_bucket{le="1"} 1
                    histogram_bucket{le="2"} 2
                    histogram_bucket{le="3"} 3
                    histogram_bucket{le="+Inf"} 3
                    histogram_sum 4.5
                    histogram_count 3\n
                `);
            });

            it("multiple histograms with different labels", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ method: "GET" }, 1.5);
                histogram.observe({ method: "POST" }, 2.5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE histogram
                    histogram_bucket{method="GET",le="1"} 0
                    histogram_bucket{method="GET",le="2"} 1
                    histogram_bucket{method="GET",le="3"} 1
                    histogram_bucket{method="GET",le="+Inf"} 1
                    histogram_sum{method="GET"} 1.5
                    histogram_count{method="GET"} 1
                    histogram_bucket{method="POST",le="1"} 0
                    histogram_bucket{method="POST",le="2"} 0
                    histogram_bucket{method="POST",le="3"} 1
                    histogram_bucket{method="POST",le="+Inf"} 1
                    histogram_sum{method="POST"} 2.5
                    histogram_count{method="POST"} 1\n
                `);
            });

            it("histogram with custom buckets", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [10, 20, 30] });
                histogram.observe(15);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE histogram
                    histogram_bucket{le="10"} 0
                    histogram_bucket{le="20"} 1
                    histogram_bucket{le="30"} 1
                    histogram_bucket{le="+Inf"} 1
                    histogram_sum 15
                    histogram_count 1\n
                `);
            });

            it("histogram with common labels", async () => {
                // Arrange
                const metrics = new Metrics({ commonLabels: { service: "api" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporter(metrics);
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ method: "GET" }, 1.5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE histogram
                    histogram_bucket{service="api",method="GET",le="1"} 0
                    histogram_bucket{service="api",method="GET",le="2"} 1
                    histogram_bucket{service="api",method="GET",le="3"} 1
                    histogram_bucket{service="api",method="GET",le="+Inf"} 1
                    histogram_sum{service="api",method="GET"} 1.5
                    histogram_count{service="api",method="GET"} 1\n
                `);
            });
        });
    });

    describe("async collect", () => {
        let metrics: Metrics;
        let exporter: PrometheusExporter;

        beforeEach(() => {
            metrics = new Metrics({ enableInternalMetrics: false });
            exporter = new PrometheusExporter(metrics);
        });

        it("sync callback", async () => {
            // Arrange
            const counter = metrics.createCounter("counter", "description");
            const gauge = metrics.createGauge("gauge", "description");
            const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });

            metrics.addCollectCallback(() => {
                counter.increment(3);
                gauge.increment(5);
                histogram.observe(1);
            });

            // Act
            const stream = exporter.stream();
            const result = await readStreamToString(stream);

            // Assert
            expect(result).toBe(dedent`
                # HELP description
                # TYPE counter
                counter 3

                # HELP description
                # TYPE gauge
                gauge 5

                # HELP description
                # TYPE histogram
                histogram_bucket{le="1"} 1
                histogram_bucket{le="2"} 1
                histogram_bucket{le="3"} 1
                histogram_bucket{le="+Inf"} 1
                histogram_sum 1
                histogram_count 1\n
            `);
        });

        it("async callback", async () => {
            // Arrange
            const counter = metrics.createCounter("counter", "description");
            const gauge = metrics.createGauge("gauge", "description");
            const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });

            metrics.addCollectCallback(async () => {
                counter.increment(3);
                gauge.increment(5);
                histogram.observe(1);
            });

            // Act
            const stream = exporter.stream();
            const result = await readStreamToString(stream);

            // Assert
            expect(result).toBe(dedent`
                # HELP description
                # TYPE counter
                counter 3

                # HELP description
                # TYPE gauge
                gauge 5

                # HELP description
                # TYPE histogram
                histogram_bucket{le="1"} 1
                histogram_bucket{le="2"} 1
                histogram_bucket{le="3"} 1
                histogram_bucket{le="+Inf"} 1
                histogram_sum 1
                histogram_count 1\n
            `);
        });
    });

    describe("internal metrics", () => {
        let metrics: Metrics;
        let exporter: PrometheusExporter;

        beforeEach(() => {
            metrics = new Metrics({ enableInternalMetrics: true });
            exporter = new PrometheusExporter(metrics);
        });

        it("empty state", async () => {
            // Arrange
            // Act
            const stream = exporter.stream();
            const result = await readStreamToString(stream);

            // Assert
            expect(result).toBe(dedent`
                # HELP Total number of samples
                # TYPE counter

                # HELP Total number of timeseries
                # TYPE counter

                # HELP Total number of metrics
                # TYPE counter
                metriq_metrics_total 3\n
            `);
        });

        it("single counter", async () => {
            // Arrange
            const counter = metrics.createCounter("counter", "description");
            counter.increment(5);

            // Act
            const stream = exporter.stream();
            const result = await readStreamToString(stream);

            // Assert
            expect(result).toBe(dedent`
                # HELP description
                # TYPE counter
                counter 5

                # HELP Total number of samples
                # TYPE counter
                metriq_samples_total{instrument="counter"} 1

                # HELP Total number of timeseries
                # TYPE counter
                metriq_timeseries_total{instrument="counter"} 1

                # HELP Total number of metrics
                # TYPE counter
                metriq_metrics_total 4\n
            `);
        });
    });
});
