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
