import { describe, it, expect } from "vitest";
import { Metrics } from "../metrics";
import { Registry } from "../registry";
import { PrometheusExporter } from "./prometheus";
import { Counter } from "../instruments/counter";

describe("PrometheusExporter", () => {
    it("should write metrics", () => {
        // Arrange
        const registry = new Registry();
        const metrics = new Metrics(registry);
        const exporter = new PrometheusExporter(metrics);

        const counter = new Counter("counter", "description", ["key"], registry);

        counter.increment({ key: "value" });

        // Act
        const result = exporter.write();

        // Assert
        expect(result).toBe(`
        # HELP description
        # TYPE counter
        counter{key="value"} 1`);
    });
});
