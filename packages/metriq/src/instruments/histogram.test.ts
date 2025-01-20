import { describe, it, expect, beforeEach } from "vitest";
import { MetricsImpl } from "../metrics";

describe("Histogram", () => {
    let metrics: MetricsImpl;

    beforeEach(() => {
        metrics = new MetricsImpl();
    });

    it("should create a default histogram", () => {
        // Arrange
        const histogram = metrics.createHistogram("hist", "description");

        // Act
        histogram.observe(1);

        // Assert
        const value = histogram.getValue({});
        expect(value).toEqual([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
    });

    it("should return undefined when no observations are made", () => {
        // Arrange
        const histogram = metrics.createHistogram("hist", "description", { buckets: [1, 2, 3] });

        // Act
        const value = histogram.getValue({});

        // Assert
        expect(value).toBeUndefined();
    });

    it("should count observation in correct buckets", () => {
        // Arrange
        const histogram = metrics.createHistogram("hist", "description", { buckets: [1, 2, 3] });

        // Act
        histogram.observe(1.5);

        // Assert
        const value = histogram.getValue({})!;
        expect(value[0]).toBe(0); // <= 1
        expect(value[1]).toBe(1); // <= 2
        expect(value[2]).toBe(1); // <= 3
        expect(value[3]).toBe(1); // +Inf
        expect(value[4]).toBe(1.5); // sum
    });

    it("should accumulate multiple observations", () => {
        // Arrange
        const histogram = metrics.createHistogram("hist", "description", { buckets: [1, 2, 3] });

        // Act
        histogram.observe(0.5);
        histogram.observe(1.5);
        histogram.observe(2.5);

        // Assert
        const value = histogram.getValue({})!;
        expect(value[0]).toBe(1); // <= 1
        expect(value[1]).toBe(2); // <= 2
        expect(value[2]).toBe(3); // <= 3
        expect(value[3]).toBe(3); // +Inf
        expect(value[4]).toBe(4.5); // sum
    });

    it("should handle observations with labels", () => {
        // Arrange
        const histogram = metrics.createHistogram("hist", "description", { buckets: [1, 2, 3] });
        const labels = { method: "GET" };

        // Act
        histogram.observe(labels, 1.5);

        // Assert
        const value = histogram.getValue(labels)!;
        expect(value[0]).toBe(0); // <= 1
        expect(value[1]).toBe(1); // <= 2
        expect(value[2]).toBe(1); // <= 3
        expect(value[3]).toBe(1); // +Inf
        expect(value[4]).toBe(1.5); // sum
    });

    it("should handle multiple label sets independently", () => {
        // Arrange
        const histogram = metrics.createHistogram("hist", "description", { buckets: [1, 2, 3] });

        // Act
        histogram.observe({ method: "GET" }, 1.5);
        histogram.observe({ method: "POST" }, 2.5);

        // Assert
        const getValue1 = histogram.getValue({ method: "GET" })!;
        expect(getValue1[0]).toBe(0); // <= 1
        expect(getValue1[1]).toBe(1); // <= 2
        expect(getValue1[2]).toBe(1); // <= 3
        expect(getValue1[3]).toBe(1); // +Inf
        expect(getValue1[4]).toBe(1.5); // sum

        const getValue2 = histogram.getValue({ method: "POST" })!;
        expect(getValue2[0]).toBe(0); // <= 1
        expect(getValue2[1]).toBe(0); // <= 2
        expect(getValue2[2]).toBe(1); // <= 3
        expect(getValue2[3]).toBe(1); // +Inf
        expect(getValue2[4]).toBe(2.5); // sum
    });

    it("should return undefined for unobserved label sets", () => {
        // Arrange
        const histogram = metrics.createHistogram("hist", "description", { buckets: [1, 2, 3] });

        // Act
        histogram.observe({ method: "GET" }, 1.5);

        // Assert
        const value = histogram.getValue({ method: "POST" });
        expect(value).toBeUndefined();
    });

    it("should use custom buckets", () => {
        // Arrange
        const histogram = metrics.createHistogram("hist", "description", { buckets: [10, 20, 30] });

        // Act
        histogram.observe(15);

        // Assert
        const value = histogram.getValue({})!;
        expect(value[0]).toBe(0); // <= 10
        expect(value[1]).toBe(1); // <= 20
        expect(value[2]).toBe(1); // <= 30
        expect(value[3]).toBe(1); // +Inf
        expect(value[4]).toBe(15); // sum
    });
});
