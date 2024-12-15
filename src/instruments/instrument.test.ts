import { it, expect, beforeEach, afterEach, vi } from "vitest";
import { Instrument } from "./instrument";
import { Registry } from "../registry";
import { describe } from "node:test";

class TestInstrument extends Instrument<number> {}

describe("Instrument", () => {
    describe("TTL", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should set the value and retrieve it correctly", () => {
            // Arrange
            const registry = new Registry();
            const instrument = new TestInstrument("name", "description", [], registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);

            // Assert
            expect(instrument.getValue({})).toBe(3);
        });

        it("should not expire the value if ttl is not set", () => {
            // Arrange
            const registry = new Registry();
            const instrument = new TestInstrument("name", "description", [], registry);

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(1001);

            // Assert
            expect(instrument.getValue({})).toBe(3);
        });

        it("should update the value and retrieve it correctly", () => {
            // Arrange
            const registry = new Registry();
            const instrument = new TestInstrument("name", "description", [], registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(500);
            instrument.updateValue({}, (v) => (v ?? 0) + 5);

            // Assert
            expect(instrument.getValue({})).toBe(8);
        });

        it("should return undefined if the value is expired", () => {
            // Arrange
            const registry = new Registry();
            const instrument = new TestInstrument("name", "description", [], registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(1001);

            // Assert
            expect(instrument.getValue({})).toBe(undefined);
        });

        it("should use undefined as base value when expired", () => {
            // Arrange
            const registry = new Registry();
            const instrument = new TestInstrument("name", "description", [], registry, { ttl: 1000 });

            // Act
            instrument.updateValue({}, () => 3);
            vi.advanceTimersByTime(1001);
            instrument.updateValue({}, (v) => (v ?? 0) + 5);

            // Assert
            expect(instrument.getValue({})).toBe(5);
        });

        it("should reset TTL when updating the value", () => {
            // Arrange
            const registry = new Registry();
            const instrument = new TestInstrument("name", "description", [], registry, { ttl: 1000 });

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
