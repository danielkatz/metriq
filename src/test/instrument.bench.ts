import { bench, describe } from "vitest";
import { Metrics } from "../metrics";
import { Counter } from "../instruments/counter";
import pc from "prom-client";

describe("increment counter without labels", () => {
    const metrics = new Metrics({});
    const counter = new Counter("counter1", "description", [], metrics.defaultRegistry);

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
    const counter = new Counter("counter1", "description", ["key1", "key2"], metrics.defaultRegistry);

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
