import { bench, describe } from "vitest";
import { PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";
import express from "express";
import getPort from "get-port";
import { metriq } from "metriq";
import { prometheus } from "@metriq/express";
import pc from "prom-client";

const CARDINALITIES = [10, 100, 1000, 10_000, 100_000, 500_000, 1_000_000];
const METRIQ_PATH = "/metriq";
const PROM_CLIENT_PATH = "/prom-client";

const baseUrls = new Map<number, string>();

for (const cardinality of CARDINALITIES) {
    // Setup metriq
    const metrics = metriq({ enableInternalMetrics: false });
    const counter = metrics.createCounter("counter1", "description");

    // Setup prometheus
    const pcRegistry = new pc.Registry();
    const pcCounter = new pc.Counter({
        name: "counter1",
        help: "description",
        labelNames: ["key1"],
        registers: [pcRegistry],
    });

    // Setup data
    for (let i = 0; i < cardinality; i++) {
        const label = `value${i}`;
        counter.increment({ key1: label }, 5);
        pcCounter.labels(label).inc(5);
    }

    // Setup express
    const port = await getPort();
    const app = express();
    app.get(METRIQ_PATH, prometheus(metrics));
    app.get(PROM_CLIENT_PATH, (req, res, next) => {
        res.set("Content-Type", pcRegistry.contentType);

        pcRegistry
            .metrics()
            .then((metrics) => {
                res.end(metrics);
            })
            .catch((ex) => {
                next(ex);
            });
    });
    app.listen(port);
    baseUrls.set(cardinality, `http://localhost:${port}`);
}

// Benchmark
describe.each(CARDINALITIES)("Express (cardinality=%d)", (cardinality) => {
    bench(
        "metriq",
        async () => {
            const baseUrl = baseUrls.get(cardinality);
            if (!baseUrl) {
                throw new Error("url not found");
            }

            const response = await fetch(`${baseUrl}${METRIQ_PATH}`);

            if (!response.ok) {
                throw new Error(`unexpected status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("no response body");
            }

            const nullStream = new PassThrough();
            nullStream.resume();
            await pipeline(response.body, nullStream);
        },
        {
            throws: true,
        },
    );

    bench(
        "prom-client",
        async () => {
            const baseUrl = baseUrls.get(cardinality);
            if (!baseUrl) {
                throw new Error("url not found");
            }

            const response = await fetch(`${baseUrl}${PROM_CLIENT_PATH}`);

            if (!response.ok) {
                throw new Error(`unexpected status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("no response body");
            }

            const nullStream = new PassThrough();
            nullStream.resume();
            await pipeline(response.body, nullStream);
        },
        {
            throws: true,
        },
    );
});
