import { describe, it, expect, beforeEach } from "vitest";
import dedent from "dedent";
import { MetricsImpl } from "../metrics";
import { PrometheusExporterImpl } from "./prometheus";
import { readStreamToString } from "../utils";

describe("PrometheusExporter", () => {
    describe("single registry", () => {
        let metrics: MetricsImpl;
        let exporter: PrometheusExporterImpl;

        beforeEach(() => {
            metrics = new MetricsImpl({ enableInternalMetrics: false });
            exporter = new PrometheusExporterImpl(metrics);
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
                metrics.createCounter("counter", "description");

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter\n
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
                    # HELP counter description
                    # TYPE counter counter
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
                    # HELP counter description
                    # TYPE counter counter
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
                    # HELP counter description
                    # TYPE counter counter
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
                    # HELP counter description
                    # TYPE counter counter
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
                    # HELP counter description
                    # TYPE counter counter
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
                    # HELP counter1 description1
                    # TYPE counter1 counter
                    counter1 5

                    # HELP counter2 description2
                    # TYPE counter2 counter
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
                    # HELP counter1 description1
                    # TYPE counter1 counter
                    counter1{key="value"} 5

                    # HELP counter2 description2
                    # TYPE counter2 counter
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
                    # HELP counter1 description1
                    # TYPE counter1 counter
                    counter1{key="value1"} 5

                    # HELP counter2 description2
                    # TYPE counter2 counter
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
                    # HELP prefix_counter description
                    # TYPE prefix_counter counter
                    prefix_counter 5\n
                `);
            });

            it("counter with common labels", async () => {
                // Arrange
                const metrics = new MetricsImpl({ commonLabels: { key: "value" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporterImpl(metrics);

                const counter = metrics.createCounter("counter", "description");

                counter.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter{key="value"} 5\n
                `);
            });

            it("counter with common labels and instrument labels", async () => {
                // Arrange
                const metrics = new MetricsImpl({ commonLabels: { key1: "value1" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporterImpl(metrics);

                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key2: "value2" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter{key1="value1",key2="value2"} 5\n
                `);
            });

            it("should export metric family only when metrics removed", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");
                counter.increment(5);

                // Act
                counter.remove({});

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter\n
                `);
            });

            it("should export metric family only when metrics removed with labels", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key: "value" }, 5);

                // Act
                counter.remove({ key: "value" });

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter\n
                `);
            });

            it("should export only not removed metrics", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key: "foo" }, 3);
                counter.increment({ key: "bar" }, 5);

                // Act
                counter.remove({ key: "foo" });

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter{key="bar"} 5\n
                `);
            });

            it("should export metric family only when metrics are cleared", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");
                counter.increment(5);
                counter.increment({ key: "value" }, 5);

                // Act
                counter.removeAll();

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter\n
                `);
            });
        });

        describe("gauge", () => {
            it("empty state", async () => {
                // Arrange
                metrics.createGauge("gauge", "description");

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge\n
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
                    # HELP gauge description
                    # TYPE gauge gauge
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
                    # HELP gauge description
                    # TYPE gauge gauge
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
                    # HELP gauge description
                    # TYPE gauge gauge
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
                    # HELP gauge description
                    # TYPE gauge gauge
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
                    # HELP gauge description
                    # TYPE gauge gauge
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
                    # HELP gauge1 description1
                    # TYPE gauge1 gauge
                    gauge1 5

                    # HELP gauge2 description2
                    # TYPE gauge2 gauge
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
                    # HELP gauge1 description1
                    # TYPE gauge1 gauge
                    gauge1{key="value"} 5

                    # HELP gauge2 description2
                    # TYPE gauge2 gauge
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
                    # HELP gauge1 description1
                    # TYPE gauge1 gauge
                    gauge1{key="value1"} 5

                    # HELP gauge2 description2
                    # TYPE gauge2 gauge
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
                    # HELP prefix_gauge description
                    # TYPE prefix_gauge gauge
                    prefix_gauge 5\n
                `);
            });

            it("gauge with common labels", async () => {
                // Arrange
                const metrics = new MetricsImpl({ commonLabels: { key: "value" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporterImpl(metrics);

                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key="value"} 5\n
                `);
            });

            it("gauge with common labels and instrument labels", async () => {
                // Arrange
                const metrics = new MetricsImpl({ commonLabels: { key1: "value1" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporterImpl(metrics);

                const gauge = metrics.createGauge("gauge", "description");

                gauge.increment({ key2: "value2" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key1="value1",key2="value2"} 5\n
                `);
            });

            it("should export metric family only when metrics removed", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment(5);

                // Act
                gauge.remove({});

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge\n
                `);
            });

            it("should export metric family only when metrics removed with labels", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment({ key: "value" }, 5);

                // Act
                gauge.remove({ key: "value" });

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge\n
                `);
            });

            it("should export only not removed metrics", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment({ key: "foo" }, 3);
                gauge.increment({ key: "bar" }, 5);

                // Act
                gauge.remove({ key: "foo" });

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key="bar"} 5\n
                `);
            });

            it("should export metric family only when metrics are cleared", async () => {
                // Arrange
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment(5);
                gauge.increment({ key: "value" }, 5);

                // Act
                gauge.removeAll();

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge\n
                `);
            });
        });

        describe("histogram", () => {
            it("empty state", async () => {
                // Arrange
                metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram\n
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
                    # HELP histogram description
                    # TYPE histogram histogram
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
                    # HELP histogram description
                    # TYPE histogram histogram
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
                    # HELP histogram description
                    # TYPE histogram histogram
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
                    # HELP histogram description
                    # TYPE histogram histogram
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
                    # HELP histogram description
                    # TYPE histogram histogram
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
                const metrics = new MetricsImpl({ commonLabels: { service: "api" }, enableInternalMetrics: false });
                const exporter = new PrometheusExporterImpl(metrics);
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ method: "GET" }, 1.5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    histogram_bucket{service="api",method="GET",le="1"} 0
                    histogram_bucket{service="api",method="GET",le="2"} 1
                    histogram_bucket{service="api",method="GET",le="3"} 1
                    histogram_bucket{service="api",method="GET",le="+Inf"} 1
                    histogram_sum{service="api",method="GET"} 1.5
                    histogram_count{service="api",method="GET"} 1\n
                `);
            });

            it("should export metric family only when metrics removed", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description");
                histogram.observe(1);

                // Act
                histogram.remove({});

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram\n
                `);
            });

            it("should export metric family only when metrics removed with labels", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description");
                histogram.observe({ key: "value" }, 5);

                // Act
                histogram.remove({ key: "value" });

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram\n
                `);
            });

            it("should export only not removed metrics", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ key: "foo" }, 3);
                histogram.observe({ key: "bar" }, 5);

                // Act
                histogram.remove({ key: "foo" });

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    histogram_bucket{key="bar",le="1"} 0
                    histogram_bucket{key="bar",le="2"} 0
                    histogram_bucket{key="bar",le="3"} 0
                    histogram_bucket{key="bar",le="+Inf"} 0
                    histogram_sum{key="bar"} 5
                    histogram_count{key="bar"} 1\n
                `);
            });

            it("should export metric family only when metrics are cleared", async () => {
                // Arrange
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ key: "foo" }, 3);
                histogram.observe({ key: "bar" }, 5);

                // Act
                histogram.removeAll();

                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram\n
                `);
            });
        });
    });

    describe("async collect", () => {
        let metrics: MetricsImpl;
        let exporter: PrometheusExporterImpl;

        beforeEach(() => {
            metrics = new MetricsImpl({ enableInternalMetrics: false });
            exporter = new PrometheusExporterImpl(metrics);
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
                # HELP counter description
                # TYPE counter counter
                counter 3

                # HELP gauge description
                # TYPE gauge gauge
                gauge 5

                # HELP histogram description
                # TYPE histogram histogram
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

                await Promise.resolve();
            });

            // Act
            const stream = exporter.stream();
            const result = await readStreamToString(stream);

            // Assert
            expect(result).toBe(dedent`
                # HELP counter description
                # TYPE counter counter
                counter 3

                # HELP gauge description
                # TYPE gauge gauge
                gauge 5

                # HELP histogram description
                # TYPE histogram histogram
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
        let metrics: MetricsImpl;
        let exporter: PrometheusExporterImpl;

        beforeEach(() => {
            metrics = new MetricsImpl({ enableInternalMetrics: true });
            exporter = new PrometheusExporterImpl(metrics);
        });

        it("empty state", async () => {
            // Arrange
            // Act
            const stream = exporter.stream();
            const result = await readStreamToString(stream);

            // Assert
            expect(result).toBe(dedent`
                # HELP metriq_samples_count Current number of samples registered
                # TYPE metriq_samples_count gauge

                # HELP metriq_timeseries_count Current number of timeseries registered
                # TYPE metriq_timeseries_count gauge

                # HELP metriq_metrics_count Current number of metrics registered
                # TYPE metriq_metrics_count gauge
                metriq_metrics_count 3

                # HELP metriq_scrapes_total Number of scrapes since startup
                # TYPE metriq_scrapes_total counter

                # HELP metriq_last_scrape_bytes Bytes returned during last scrape
                # TYPE metriq_last_scrape_bytes gauge

                # HELP metriq_last_scrape_duration_seconds Duration of last scrape in seconds
                # TYPE metriq_last_scrape_duration_seconds gauge\n
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
                # HELP counter description
                # TYPE counter counter
                counter 5

                # HELP metriq_samples_count Current number of samples registered
                # TYPE metriq_samples_count gauge
                metriq_samples_count{instrument="counter"} 1

                # HELP metriq_timeseries_count Current number of timeseries registered
                # TYPE metriq_timeseries_count gauge
                metriq_timeseries_count{instrument="counter"} 1

                # HELP metriq_metrics_count Current number of metrics registered
                # TYPE metriq_metrics_count gauge
                metriq_metrics_count 4

                # HELP metriq_scrapes_total Number of scrapes since startup
                # TYPE metriq_scrapes_total counter

                # HELP metriq_last_scrape_bytes Bytes returned during last scrape
                # TYPE metriq_last_scrape_bytes gauge

                # HELP metriq_last_scrape_duration_seconds Duration of last scrape in seconds
                # TYPE metriq_last_scrape_duration_seconds gauge\n
            `);
        });
    });
});
