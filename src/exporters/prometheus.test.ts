import { describe, it, expect, beforeEach } from "vitest";
import dedent from "dedent";
import { Metrics } from "../metrics";
import { PrometheusExporter } from "./prometheus";
import { readStreamToString } from "../utils";

describe("PrometheusExporter", () => {
    describe("single registry", () => {
        let metrics: Metrics;
        let exporter: PrometheusExporter;

        beforeEach(() => {
            metrics = new Metrics();
            exporter = new PrometheusExporter(metrics);
        });

        it("empty state", async () => {
            // Arrange
            // Act
            const stream = exporter.stream();
            const result = await readStreamToString(stream);

            // Assert
            expect(result).toBe("");
        });

        describe("counter", () => {
            it("single counter with no labels", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{} 5\n
                `);
            });

            it("single counter with a label", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key: "value" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key="value"} 5\n
                `);
            });

            it("single counter with multiple labels", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key1: "value1", key2: "value2" }, 5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key1="value1",key2="value2"} 5\n
                `);
            });

            it("single counter with multiple label values", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key: "value1" }, 5);
                counter.increment({ key: "value2" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key="value1"} 5
                    counter{key="value2"} 7\n
                `);
            });

            it("single counter with multiple label keys", async () => {
                // Arrange
                const counter = metrics.createCounter("counter", "description");

                counter.increment({ key1: "value1", key2: "value2" }, 5);
                counter.increment({ key1: "value3", key2: "value4" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    counter{key1="value1",key2="value2"} 5
                    counter{key1="value3",key2="value4"} 7\n
                `);
            });

            it("multiple counters with no labels", async () => {
                // Arrange
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");

                counter1.increment(5);
                counter2.increment(7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE counter
                    counter1{} 5

                    # HELP description2
                    # TYPE counter
                    counter2{} 7\n
                `);
            });

            it("multiple counters with same labels and same label value", async () => {
                // Arrange
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");

                counter1.increment({ key: "value" }, 5);
                counter2.increment({ key: "value" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE counter
                    counter1{key="value"} 5

                    # HELP description2
                    # TYPE counter
                    counter2{key="value"} 7\n
                `);
            });

            it("multiple counters with same labels and different label values", async () => {
                // Arrange
                const counter1 = metrics.createCounter("counter1", "description1");
                const counter2 = metrics.createCounter("counter2", "description2");

                counter1.increment({ key: "value1" }, 5);
                counter2.increment({ key: "value2" }, 7);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description1
                    # TYPE counter
                    counter1{key="value1"} 5

                    # HELP description2
                    # TYPE counter
                    counter2{key="value2"} 7\n
                `);
            });

            it("counter with prefix", async () => {
                // Arrange
                const registry = metrics.createRegistry({ commonPrefix: "prefix_" });
                const instrument = registry.createCounter("counter", "description");

                instrument.increment(5);

                // Act
                const stream = exporter.stream();
                const result = await readStreamToString(stream);

                // Assert
                expect(result).toBe(dedent`
                    # HELP description
                    # TYPE counter
                    prefix_counter{} 5\n
                `);
            });
        });
    });
});
