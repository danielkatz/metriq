import { bench, describe } from "vitest";
import { pipeline } from "node:stream/promises";
import { PassThrough } from "node:stream";
import { Metrics } from "../metrics";
import { PrometheusExporter } from "./prometheus";
import pc from "prom-client";

describe.each([10, 100, 1000, 10_000, 100_000, 1_000_000])("PrometheusExporter (cardinality=%d)", (cardinality) => {
    const metrics = new Metrics({});
    const counter = metrics.createCounter("counter1", "description");
    const exporter = new PrometheusExporter(metrics);

    const pcRegistry = new pc.Registry();
    const pcCounter = new pc.Counter({
        name: "counter1",
        help: "description",
        labelNames: ["key1"],
        registers: [pcRegistry],
    });

    for (let i = 0; i < cardinality; i++) {
        const label = `value${i}`;
        counter.increment({ key1: label }, 5);
        pcCounter.labels(label).inc(5);
    }

    bench("metrics", async () => {
        const nullStream = new PassThrough();
        nullStream.resume();

        const stream = exporter.stream();
        await pipeline(stream, nullStream);
    });

    bench("prom-client", async () => {
        const text = await pcRegistry.metrics();

        // make sure it is not optimized away
        if (text.length === 0) {
            throw new Error("unexpected empty text");
        }
    });
});
