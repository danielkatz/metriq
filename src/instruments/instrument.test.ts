import { it, expect, describe, beforeEach, afterEach, vi } from "vitest";
import { Instrument, InstrumentOptions } from "./instrument";
import { Registry } from "../registry";
import { Metrics } from "../metrics";

class TestInstrument extends Instrument<number> {
    constructor(name: string, description: string, registry: Registry, options?: InstrumentOptions) {
        super(name, description, registry, options);

        registry["registerInstrument"](this);
    }
}

describe("Instrument", () => {
    describe("Options", () => {
        let metrics: Metrics;

        beforeEach(() => {
            metrics = new Metrics();
        });

        it("should have undefined TTL when not specified", () => {
            // Arrange
            const registry = metrics.createRegistry({});

            // Act
            const counter = registry.createCounter("name", "description");

            // Assert
            expect(counter.options.ttl).toBeUndefined();
        });

        it("should use the default TTL from the registry", () => {
            // Arrange
            const registry = metrics.createRegistry({ defaultTtl: 60000 });

            // Act
            const counter = registry.createCounter("name", "description");

            // Assert
            expect(counter.options.ttl).toBe(60000);
        });
    });

    describe("TTL", () => {
        let registry: Registry;
        let metrics: Metrics;

        beforeEach(() => {
            metrics = new Metrics();
            registry = metrics.defaultRegistry;

            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should set the value and retrieve it correctly", () => {
            // Arrange
            const instrument = new TestInstrument("name", "description", registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);

            // Assert
            expect(instrument.getValue({})).toBe(3);
        });

        it("should not expire the value if ttl is not set", () => {
            // Arrange
            const instrument = new TestInstrument("name", "description", registry);

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(1001);

            // Assert
            expect(instrument.getValue({})).toBe(3);
        });

        it("should update the value and retrieve it correctly", () => {
            // Arrange
            const instrument = new TestInstrument("name", "description", registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(500);
            instrument.updateValue({}, (v) => (v ?? 0) + 5);

            // Assert
            expect(instrument.getValue({})).toBe(8);
        });

        it("should return undefined if the value is expired", () => {
            // Arrange
            const instrument = new TestInstrument("name", "description", registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(1001);

            // Assert
            expect(instrument.getValue({})).toBe(undefined);
        });

        it("should use undefined as base value when expired", () => {
            // Arrange
            const instrument = new TestInstrument("name", "description", registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(1001);
            instrument.updateValue({}, (v) => (v ?? 0) + 5);

            // Assert
            expect(instrument.getValue({})).toBe(5);
        });

        it("should reset TTL when updating the value", () => {
            // Arrange
            const instrument = new TestInstrument("name", "description", registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(600);
            instrument.updateValue({}, (v) => (v ?? 0) + 5);
            vi.advanceTimersByTime(600);

            // Assert
            expect(instrument.getValue({})).toBe(8);
        });
    });
});
