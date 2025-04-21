import { describe, it, expect, beforeEach } from "vitest";
import { MetricsImpl } from "../../metrics";

describe("Summary", () => {
    let metrics: MetricsImpl;

    beforeEach(() => {
        metrics = new MetricsImpl();
    });

    it("should create a default summary", () => {
        // Arrange
        const summary = metrics.createSummary("summary", "description");

        // Act
        summary.observe(1);

        // Assert
        const value = summary.getDebugValue({});
        expect(value).toBeDefined();
        expect(value?.sum).toBe(1);
        expect(value?.count).toBe(1);
        expect(value?.percentiles.size).toBe(7); // Default percentiles
    });

    it("should return undefined when no observations are made", () => {
        // Arrange
        const summary = metrics.createSummary("summary", "description");

        // Act
        const value = summary.getDebugValue({});

        // Assert
        expect(value).toBeUndefined();
    });

    it("should calculate correct percentiles", () => {
        // Arrange
        const summary = metrics.createSummary("summary", "description", {
            percentiles: [0.5, 0.9],
        });

        // Act
        for (let i = 1; i <= 100; i++) {
            summary.observe(i);
        }

        // Assert
        const value = summary.getDebugValue({})!;
        expect(value.percentiles.get(0.5)).toBeCloseTo(50, 0);
        expect(value.percentiles.get(0.9)).toBeCloseTo(90, 0);
        expect(value.sum).toBe(5050); // Sum of 1 to 100
        expect(value.count).toBe(100);
    });

    it("should handle observations with labels", () => {
        // Arrange
        const summary = metrics.createSummary("summary", "description");
        const labels = { method: "GET" };

        // Act
        summary.observe(labels, 1.5);

        // Assert
        const value = summary.getDebugValue(labels)!;
        expect(value.sum).toBe(1.5);
        expect(value.count).toBe(1);
    });

    it("should handle multiple label sets independently", () => {
        // Arrange
        const summary = metrics.createSummary("summary", "description");

        // Act
        summary.observe({ method: "GET" }, 1.5);
        summary.observe({ method: "POST" }, 2.5);

        // Assert
        const getValue1 = summary.getDebugValue({ method: "GET" })!;
        expect(getValue1.sum).toBe(1.5);
        expect(getValue1.count).toBe(1);

        const getValue2 = summary.getDebugValue({ method: "POST" })!;
        expect(getValue2.sum).toBe(2.5);
        expect(getValue2.count).toBe(1);
    });

    it("should return undefined for unobserved label sets", () => {
        // Arrange
        const summary = metrics.createSummary("summary", "description");

        // Act
        summary.observe({ method: "GET" }, 1.5);

        // Assert
        const value = summary.getDebugValue({ method: "POST" });
        expect(value).toBeUndefined();
    });
});
