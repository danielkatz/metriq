import { bench, describe } from "vitest";
import { Metrics } from "../src/metrics";
import pc from "prom-client";

describe("increment counter without labels", () => {
    const metrics = new Metrics({});
    const counter = metrics.createCounter("counter1", "description");

    const pcRegistry = new pc.Registry();
    const pcCounter = new pc.Counter({
        name: "counter1",
        help: "description",
        labelNames: [],
        registers: [pcRegistry],
    });

    bench("metrics", () => {
        counter.increment(5);
    });

    bench("prom-client", () => {
        pcCounter.inc(5);
    });
});

describe("increment counter with labels", () => {
    const metrics = new Metrics({});
    const counter = metrics.createCounter("counter1", "description");

    const pcRegistry = new pc.Registry();
    const pcCounter = new pc.Counter({
        name: "counter1",
        help: "description",
        labelNames: ["key1", "key2"],
        registers: [pcRegistry],
    });

    bench("metrics", () => {
        counter.increment({ key1: "value1", key2: "value2" }, 5);
    });

    bench("prom-client", () => {
        pcCounter.labels("value1", "value2").inc(5);
    });
});
