import { describe, it, expect, beforeEach } from "vitest";
import dedent from "dedent";
import { MetricsImpl } from "../metrics";
import { OpenMetricsFormatterImpl } from "./openmetrics-formatter";
import { consumeAsyncStringGenerator } from "../utils";

describe("OpenMetricsFormatter", () => {
    describe("single registry", () => {
        let metrics: MetricsImpl;
        let formatter: OpenMetricsFormatterImpl;

        beforeEach(() => {
            metrics = new MetricsImpl({ enableInternalMetrics: false });
            formatter = new OpenMetricsFormatterImpl(metrics);
        });

        it("empty state", async () => {
            const stream = formatter.writeMetrics();
            const result = await consumeAsyncStringGenerator(stream);

            expect(result).toBe("# EOF\n");
        });

        describe("counter", () => {
            it("empty state", async () => {
                metrics.createCounter("counter", "description");

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    # EOF\n
                `);
            });

            it("single counter with no labels", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment(5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter_total 5
                    # EOF\n
                `);
            });

            it("single counter with a label", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key: "value" }, 5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter_total{key="value"} 5
                    # EOF\n
                `);
            });

            it("single counter with multiple labels", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key1: "value1", key2: "value2" }, 5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter_total{key1="value1",key2="value2"} 5
                    # EOF\n
                `);
            });

            it("single counter with multiple label values", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key: "value1" }, 5);
                counter.increment({ key: "value2" }, 7);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter_total{key="value1"} 5
                    counter_total{key="value2"} 7
                    # EOF\n
                `);
            });

            it("single counter with multiple label keys", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key1: "value1", key2: "value2" }, 5);
                counter.increment({ key1: "value3", key2: "value4" }, 7);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter_total{key1="value1",key2="value2"} 5
                    counter_total{key1="value3",key2="value4"} 7
                    # EOF\n
                `);
            });

            it("multiple counters with no labels", async () => {
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");
                counter1.increment(5);
                counter2.increment(7);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter1 description1
                    # TYPE counter1 counter
                    counter1_total 5

                    # HELP counter2 description2
                    # TYPE counter2 counter
                    counter2_total 7
                    # EOF\n
                `);
            });

            it("multiple counters with same labels and same label value", async () => {
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");
                counter1.increment({ key: "value" }, 5);
                counter2.increment({ key: "value" }, 7);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter1 description1
                    # TYPE counter1 counter
                    counter1_total{key="value"} 5

                    # HELP counter2 description2
                    # TYPE counter2 counter
                    counter2_total{key="value"} 7
                    # EOF\n
                `);
            });

            it("multiple counters with same labels and different label values", async () => {
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");
                counter1.increment({ key: "value1" }, 5);
                counter2.increment({ key: "value2" }, 7);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter1 description1
                    # TYPE counter1 counter
                    counter1_total{key="value1"} 5

                    # HELP counter2 description2
                    # TYPE counter2 counter
                    counter2_total{key="value2"} 7
                    # EOF\n
                `);
            });

            it("counter with prefix", async () => {
                const registry = metrics.createRegistry({ commonPrefix: "prefix_" });
                const instrument = registry.createCounter("counter", "description");
                instrument.increment(5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP prefix_counter description
                    # TYPE prefix_counter counter
                    prefix_counter_total 5
                    # EOF\n
                `);
            });

            it("counter with common labels", async () => {
                const metrics = new MetricsImpl({ commonLabels: { key: "value" }, enableInternalMetrics: false });
                const formatter = new OpenMetricsFormatterImpl(metrics);
                const counter = metrics.createCounter("counter", "description");
                counter.increment(5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter_total{key="value"} 5
                    # EOF\n
                `);
            });

            it("counter with common labels and instrument labels", async () => {
                const metrics = new MetricsImpl({ commonLabels: { key1: "value1" }, enableInternalMetrics: false });
                const formatter = new OpenMetricsFormatterImpl(metrics);
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key2: "value2" }, 5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter_total{key1="value1",key2="value2"} 5
                    # EOF\n
                `);
            });

            it("should export metric family only when metrics removed", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment(5);
                counter.remove({});

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    # EOF\n
                `);
            });

            it("should export metric family only when metrics removed with labels", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key: "value" }, 5);
                counter.remove({ key: "value" });

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    # EOF\n
                `);
            });

            it("should export only not removed metrics", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment({ key: "foo" }, 3);
                counter.increment({ key: "bar" }, 5);
                counter.remove({ key: "foo" });

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    counter_total{key="bar"} 5
                    # EOF\n
                `);
            });

            it("should export metric family only when metrics are cleared", async () => {
                const counter = metrics.createCounter("counter", "description");
                counter.increment(5);
                counter.increment({ key: "value" }, 5);
                counter.removeAll();

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter description
                    # TYPE counter counter
                    # EOF\n
                `);
            });
        });

        describe("gauge", () => {
            it("empty state", async () => {
                metrics.createGauge("gauge", "description");

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    # EOF\n
                `);
            });

            it("single gauge with no labels", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment(5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge 5
                    # EOF\n
                `);
            });

            it("single gauge with a label", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment({ key: "value" }, 5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key="value"} 5
                    # EOF\n
                `);
            });

            it("single gauge with multiple labels", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment({ key1: "value1", key2: "value2" }, 5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key1="value1",key2="value2"} 5
                    # EOF\n
                `);
            });

            it("single gauge with multiple label values", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment({ key: "value1" }, 5);
                gauge.increment({ key: "value2" }, 7);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key="value1"} 5
                    gauge{key="value2"} 7
                    # EOF\n
                `);
            });

            it("single gauge with multiple label keys", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment({ key1: "value1", key2: "value2" }, 5);
                gauge.increment({ key1: "value3", key2: "value4" }, 7);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key1="value1",key2="value2"} 5
                    gauge{key1="value3",key2="value4"} 7
                    # EOF\n
                `);
            });

            it("multiple gauges with no labels", async () => {
                const gauge1 = metrics.createGauge("gauge1", "description1");
                const gauge2 = metrics.createGauge("gauge2", "description2");
                gauge1.increment(5);
                gauge2.increment(7);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge1 description1
                    # TYPE gauge1 gauge
                    gauge1 5

                    # HELP gauge2 description2
                    # TYPE gauge2 gauge
                    gauge2 7
                    # EOF\n
                `);
            });

            it("gauge with prefix", async () => {
                const registry = metrics.createRegistry({ commonPrefix: "prefix_" });
                const instrument = registry.createGauge("gauge", "description");
                instrument.increment(5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP prefix_gauge description
                    # TYPE prefix_gauge gauge
                    prefix_gauge 5
                    # EOF\n
                `);
            });

            it("gauge with common labels", async () => {
                const metrics = new MetricsImpl({ commonLabels: { key: "value" }, enableInternalMetrics: false });
                const formatter = new OpenMetricsFormatterImpl(metrics);
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment(5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key="value"} 5
                    # EOF\n
                `);
            });

            it("should export metric family only when metrics removed", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment(5);
                gauge.remove({});

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    # EOF\n
                `);
            });

            it("should export only not removed metrics", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment({ key: "foo" }, 3);
                gauge.increment({ key: "bar" }, 5);
                gauge.remove({ key: "foo" });

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge{key="bar"} 5
                    # EOF\n
                `);
            });

            it("should export metric family only when metrics are cleared", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.increment(5);
                gauge.increment({ key: "value" }, 5);
                gauge.removeAll();

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    # EOF\n
                `);
            });
        });

        describe("histogram", () => {
            it("empty state", async () => {
                metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    # EOF\n
                `);
            });

            it("single histogram with no labels", async () => {
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe(1.5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    histogram_bucket{le="1"} 0
                    histogram_bucket{le="2"} 1
                    histogram_bucket{le="3"} 1
                    histogram_bucket{le="+Inf"} 1
                    histogram_sum 1.5
                    histogram_count 1
                    # EOF\n
                `);
            });

            it("single histogram with labels", async () => {
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ method: "GET" }, 1.5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    histogram_bucket{method="GET",le="1"} 0
                    histogram_bucket{method="GET",le="2"} 1
                    histogram_bucket{method="GET",le="3"} 1
                    histogram_bucket{method="GET",le="+Inf"} 1
                    histogram_sum{method="GET"} 1.5
                    histogram_count{method="GET"} 1
                    # EOF\n
                `);
            });

            it("single histogram with multiple observations", async () => {
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe(0.5);
                histogram.observe(1.5);
                histogram.observe(2.5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    histogram_bucket{le="1"} 1
                    histogram_bucket{le="2"} 2
                    histogram_bucket{le="3"} 3
                    histogram_bucket{le="+Inf"} 3
                    histogram_sum 4.5
                    histogram_count 3
                    # EOF\n
                `);
            });

            it("multiple histograms with different labels", async () => {
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ method: "GET" }, 1.5);
                histogram.observe({ method: "POST" }, 2.5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

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
                    histogram_count{method="POST"} 1
                    # EOF\n
                `);
            });

            it("histogram with common labels", async () => {
                const metrics = new MetricsImpl({ commonLabels: { service: "api" }, enableInternalMetrics: false });
                const formatter = new OpenMetricsFormatterImpl(metrics);
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ method: "GET" }, 1.5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    histogram_bucket{service="api",method="GET",le="1"} 0
                    histogram_bucket{service="api",method="GET",le="2"} 1
                    histogram_bucket{service="api",method="GET",le="3"} 1
                    histogram_bucket{service="api",method="GET",le="+Inf"} 1
                    histogram_sum{service="api",method="GET"} 1.5
                    histogram_count{service="api",method="GET"} 1
                    # EOF\n
                `);
            });

            it("should export metric family only when metrics removed", async () => {
                const histogram = metrics.createHistogram("histogram", "description");
                histogram.observe(1);
                histogram.remove({});

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    # EOF\n
                `);
            });

            it("should export only not removed metrics", async () => {
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ key: "foo" }, 3);
                histogram.observe({ key: "bar" }, 5);
                histogram.remove({ key: "foo" });

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    histogram_bucket{key="bar",le="1"} 0
                    histogram_bucket{key="bar",le="2"} 0
                    histogram_bucket{key="bar",le="3"} 0
                    histogram_bucket{key="bar",le="+Inf"} 0
                    histogram_sum{key="bar"} 5
                    histogram_count{key="bar"} 1
                    # EOF\n
                `);
            });

            it("should export metric family only when metrics are cleared", async () => {
                const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });
                histogram.observe({ key: "foo" }, 3);
                histogram.observe({ key: "bar" }, 5);
                histogram.removeAll();

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP histogram description
                    # TYPE histogram histogram
                    # EOF\n
                `);
            });
        });
    });

    describe("encoding", () => {
        let metrics: MetricsImpl;
        let formatter: OpenMetricsFormatterImpl;

        beforeEach(() => {
            metrics = new MetricsImpl({ enableInternalMetrics: false });
            formatter = new OpenMetricsFormatterImpl(metrics);
        });

        describe("text values", () => {
            it("should escape double quotes", async () => {
                const specialString = 'value"with"double"quotes';
                const counter = metrics.createCounter("counter", specialString);
                counter.increment({ key: specialString }, 5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter value\"with\"double\"quotes
                    # TYPE counter counter
                    counter_total{key="value\"with\"double\"quotes"} 5
                    # EOF\n
                `);
            });

            it("should escape backslashes", async () => {
                const specialString = "value\\with\\backslashes";
                const counter = metrics.createCounter("counter", specialString);
                counter.increment({ key: specialString }, 5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP counter value\\with\\backslashes
                    # TYPE counter counter
                    counter_total{key="value\\with\\backslashes"} 5
                    # EOF\n
                `);
            });

            it("should escape newlines", async () => {
                const specialString = "value\nwith\nnewlines";
                const counter = metrics.createCounter("counter", specialString);
                counter.increment({ key: specialString }, 5);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(
                    dedent(`
                    # HELP counter value\\nwith\\nnewlines
                    # TYPE counter counter
                    counter_total{key="value\\nwith\\nnewlines"} 5
                    # EOF`) + "\n",
                );
            });
        });

        describe("metric values", () => {
            it("should encode NaN", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.set(NaN);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge NaN
                    # EOF\n
                `);
            });

            it("should encode Infinity", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.set(Infinity);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge +Inf
                    # EOF\n
                `);
            });

            it("should encode -Infinity", async () => {
                const gauge = metrics.createGauge("gauge", "description");
                gauge.set(-Infinity);

                const stream = formatter.writeMetrics();
                const result = await consumeAsyncStringGenerator(stream);

                expect(result).toBe(dedent`
                    # HELP gauge description
                    # TYPE gauge gauge
                    gauge -Inf
                    # EOF\n
                `);
            });
        });
    });

    describe("async collect", () => {
        let metrics: MetricsImpl;
        let formatter: OpenMetricsFormatterImpl;

        beforeEach(() => {
            metrics = new MetricsImpl({ enableInternalMetrics: false });
            formatter = new OpenMetricsFormatterImpl(metrics);
        });

        it("sync callback", async () => {
            const counter = metrics.createCounter("counter", "description");
            const gauge = metrics.createGauge("gauge", "description");
            const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });

            metrics.addCollectCallback(() => {
                counter.increment(3);
                gauge.increment(5);
                histogram.observe(1);
            });

            const stream = formatter.writeMetrics();
            const result = await consumeAsyncStringGenerator(stream);

            expect(result).toBe(dedent`
                # HELP counter description
                # TYPE counter counter
                counter_total 3

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
                histogram_count 1
                # EOF\n
            `);
        });

        it("async callback", async () => {
            const counter = metrics.createCounter("counter", "description");
            const gauge = metrics.createGauge("gauge", "description");
            const histogram = metrics.createHistogram("histogram", "description", { buckets: [1, 2, 3] });

            metrics.addCollectCallback(async () => {
                counter.increment(3);
                gauge.increment(5);
                histogram.observe(1);
                await Promise.resolve();
            });

            const stream = formatter.writeMetrics();
            const result = await consumeAsyncStringGenerator(stream);

            expect(result).toBe(dedent`
                # HELP counter description
                # TYPE counter counter
                counter_total 3

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
                histogram_count 1
                # EOF\n
            `);
        });
    });

    describe("internal metrics", () => {
        let metrics: MetricsImpl;
        let formatter: OpenMetricsFormatterImpl;

        beforeEach(() => {
            metrics = new MetricsImpl({ enableInternalMetrics: true });
            formatter = new OpenMetricsFormatterImpl(metrics);
        });

        it("empty state", async () => {
            const stream = formatter.writeMetrics();
            const result = await consumeAsyncStringGenerator(stream);

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
                # TYPE metriq_last_scrape_duration_seconds gauge
                # EOF\n
            `);
        });

        it("single counter", async () => {
            const counter = metrics.createCounter("counter", "description");
            counter.increment(5);

            const stream = formatter.writeMetrics();
            const result = await consumeAsyncStringGenerator(stream);

            expect(result).toBe(dedent`
                # HELP counter description
                # TYPE counter counter
                counter_total 5

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
                # TYPE metriq_last_scrape_duration_seconds gauge
                # EOF\n
            `);
        });
    });
});
