import { describe, it, expect, beforeEach } from "vitest";
import { Metrics, metriq } from "../index";

describe("Counter", () => {
    let metrics: Metrics;

    beforeEach(() => {
        metrics = metriq();
    });

    it("should increment value by one", () => {
        // Arrange
        const counter = metrics.createCounter("counter", "description");
        const labels = { key: "value" };

        // Act
        counter.increment(labels);

        // Assert
        expect(counter.getDebugValue(labels)).toBe(1);
    });

    it("should increment value by delta", () => {
        // Arrange
        const counter = metrics.createCounter("counter", "description");
        const labels = { key: "value" };

        // Act
        counter.increment(labels, 5);

        // Assert
        expect(counter.getDebugValue(labels)).toBe(5);
    });

    it("should increment value by delta multiple times", () => {
        // Arrange
        const counter = metrics.createCounter("counter", "description");
        const labels = { key: "value" };

        // Act
        counter.increment(labels, 5);
        counter.increment(labels, 3);

        // Assert
        expect(counter.getDebugValue(labels)).toBe(8);
    });

    it("should increment value by delta for different labels", () => {
        // Arrange
        const counter = metrics.createCounter("counter", "description");
        const labels1 = { key: "value1" };
        const labels2 = { key: "value2" };

        // Act
        counter.increment(labels1, 5);
        counter.increment(labels2, 3);

        // Assert
        expect(counter.getDebugValue(labels1)).toBe(5);
        expect(counter.getDebugValue(labels2)).toBe(3);
    });

    it("should return undefined if no value is set", () => {
        // Arrange
        const counter = metrics.createCounter("counter", "description");
        const labels = { key: "value" };

        // Act
        const value = counter.getDebugValue(labels);

        // Assert
        expect(value).toBe(undefined);
    });

    it("should return undefined if no value is set for different labels", () => {
        // Arrange
        const counter = metrics.createCounter("counter", "description");
        const labels1 = { key: "value1" };
        const labels2 = { key: "value2" };

        // Act
        const value1 = counter.getDebugValue(labels1);
        const value2 = counter.getDebugValue(labels2);

        // Assert
        expect(value1).toBe(undefined);
        expect(value2).toBe(undefined);
    });

    it("typed labels", () => {
        // Arrange
        type CounterLabels = { foo: string };
        const counter = metrics.createCounter<CounterLabels>("counter", "description");

        // Act
        counter.increment({ foo: "bar" });
        counter.increment({ foo: "bar", baz: "faz" });
        counter.increment({ foo: "bar", baz: "faz", dog: undefined });
        counter.increment({ foo: "bar" }, 1);
        counter.increment({ foo: "bar", baz: "faz" }, 1);
        counter.increment({ foo: "bar", baz: "faz", dog: undefined }, 1);

        // Assert
        // @ts-expect-error wrong types
        counter.increment();
        // @ts-expect-error wrong types
        counter.increment({});
        // @ts-expect-error wrong types
        counter.increment({ foo: 1 });
        // @ts-expect-error wrong types
        counter.increment({ foo: "bar", baz: "faz", num: 3 });
        // @ts-expect-error wrong types
        counter.increment(1);
        // @ts-expect-error wrong types
        counter.increment({}, 1);
        // @ts-expect-error wrong types
        counter.increment({ foo: 1 }, 1);
        // @ts-expect-error wrong types
        counter.increment({ foo: "bar", baz: "faz", num: 3 }, 1);
    });
});
