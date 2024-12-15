import { describe, it, expect, beforeEach } from "vitest";
import { Registry } from "../registry";
import { Counter } from "./counter";
import { Metrics } from "../metrics";

describe("Counter", () => {
    let registry: Registry;
    let metrics: Metrics;

    beforeEach(() => {
        metrics = new Metrics();
        registry = metrics.defaultRegistry;
    });

    it("should increment value by one", () => {
        // Arrange
        const counter = new Counter("counter", "description", ["key"], registry);
        const labels = { key: "value" };

        // Act
        counter.increment(labels);

        // Assert
        expect(counter.getValue(labels)).toBe(1);
    });

    it("should increment value by delta", () => {
        // Arrange
        const counter = new Counter("counter", "description", ["key"], registry);
        const labels = { key: "value" };

        // Act
        counter.increment(labels, 5);

        // Assert
        expect(counter.getValue(labels)).toBe(5);
    });

    it("should increment value by delta multiple times", () => {
        // Arrange
        const counter = new Counter("counter", "description", ["key"], registry);
        const labels = { key: "value" };

        // Act
        counter.increment(labels, 5);
        counter.increment(labels, 3);

        // Assert
        expect(counter.getValue(labels)).toBe(8);
    });

    it("should increment value by delta for different labels", () => {
        // Arrange
        const counter = new Counter("counter", "description", ["key"], registry);
        const labels1 = { key: "value1" };
        const labels2 = { key: "value2" };

        // Act
        counter.increment(labels1, 5);
        counter.increment(labels2, 3);

        // Assert
        expect(counter.getValue(labels1)).toBe(5);
        expect(counter.getValue(labels2)).toBe(3);
    });

    it("should return undefined if no value is set", () => {
        // Arrange
        const counter = new Counter("counter", "description", ["key"], registry);
        const labels = { key: "value" };

        // Act
        const value = counter.getValue(labels);

        // Assert
        expect(value).toBe(undefined);
    });

    it("should return undefined if no value is set for different labels", () => {
        // Arrange
        const counter = new Counter("counter", "description", ["key"], registry);
        const labels1 = { key: "value1" };
        const labels2 = { key: "value2" };

        // Act
        const value1 = counter.getValue(labels1);
        const value2 = counter.getValue(labels2);

        // Assert
        expect(value1).toBe(undefined);
        expect(value2).toBe(undefined);
    });
});
