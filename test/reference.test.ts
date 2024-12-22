import { it } from "vitest";
import client from "prom-client";

it("references the correct instruments", async () => {
    const counter = new client.Counter({
        name: "counter",
        help: "description",
        labelNames: ["key"],
    });

    counter.labels("value1").inc(5);
    counter.labels("value2").inc(7);

    console.log(await client.register.metrics());
});

it("hitogram", async () => {
    const histogram = new client.Histogram({
        name: "histogram",
        help: "description",
        buckets: [1, 2, 3],
    });

    histogram.observe(0);
    histogram.observe(1);
    histogram.observe(2);
    histogram.observe(3);
    histogram.observe(4);

    console.log(await client.register.metrics());
});

it("gauge", async () => {
    const gauge = new client.Gauge({
        name: "gauge",
        help: "description",
        labelNames: ["key"],
    });

    gauge.labels("value1").inc(5);
    gauge.labels("value2").inc(7);

    gauge.labels("value1").dec(2);

    gauge.labels("value2").set(42);

    console.log(await client.register.metrics());
});
