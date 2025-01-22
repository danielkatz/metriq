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

it("counter without labels", async () => {
    const counter = new client.Counter({
        name: "counter1",
        help: "description",
    });

    counter.inc(5);

    console.log(await client.register.metrics());
});

it("counter - empty state", async () => {
    const counter = new client.Counter({
        name: "counter2",
        help: "description",
    });

    console.log(await client.register.metrics());
});

it("gauge - empty state", async () => {
    const gauge = new client.Gauge({
        name: "gauge2",
        help: "description",
        labelNames: ["key"],
    });

    console.log(await client.register.metrics());
});

it("histogram - empty state", async () => {
    const histogram = new client.Histogram({
        name: "histogram2",
        help: "description",
        buckets: [1, 2, 3],
    });

    console.log(await client.register.metrics());
});

it("test", async () => {
    const counter = new client.Counter({
        name: "counter3",
        help: "description",
        labelNames: ["key"],
    });

    counter.labels("foo").inc(5);
    counter.labels("bar").inc(5);

    //counter.reset();
    counter.remove("foo");

    console.log(await client.register.metrics());
});
