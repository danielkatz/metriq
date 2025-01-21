import { metriq } from "metriq";
import { prometheus } from "@metriq/express";
import express, { Request, Response, NextFunction } from "express";
import pc from "prom-client";

const PORT = 3001;
const CARDINAL_KEY = "key1";

const app = express();
const metrics = metriq();

const pcRegistry = new pc.Registry();
const pcCounter = new pc.Counter({
    name: "my_counter",
    help: "just a counter",
    labelNames: [CARDINAL_KEY],
    registers: [pcRegistry],
});

const counter = metrics.createCounter("my_counter", "just a counter");

let cardinality = 1;

app.get("/cardinality", (req, res) => {
    res.send(`Cardinality: ${cardinality}`);
});

app.post("/cardinality/:value", (req, res) => {
    const value = +req.params.value;
    cardinality = value;
    res.send(`Cardinality: ${cardinality}`);
});

app.post("/update", (req, res) => {
    for (let i = 0; i < cardinality; i++) {
        const label = `value${i}`;
        counter.increment({ [CARDINAL_KEY]: label }, 1);
        pcCounter.labels(label).inc(1);
    }
    res.send(`Updated: ${cardinality}`);
});

app.post("/reset", (req, res) => {
    pcRegistry.clear();
    counter.clear();

    res.send("Reset");
});

app.get("/metriq", prometheus(metrics));

app.get("/prom-client", (req, res, next) => {
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

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    res.status(500).end(err instanceof Error ? err.message : "unknown error");
});

app.listen(PORT);

console.log(`Server is running on port ${PORT}, http://localhost:${PORT}/metrics`);
