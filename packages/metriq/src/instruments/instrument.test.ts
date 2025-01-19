import { it, expect, describe, beforeEach, afterEach, vi } from "vitest";
import { Instrument, InstrumentOptions } from "./instrument";
import { Registry } from "../registry";
import { Metrics } from "../metrics";
import { InstrumentFactory } from "./factory";

class TestInstrument extends Instrument<number> {
    constructor(name: string, description: string, registry: Registry, options?: InstrumentOptions) {
        super(name, description, registry, options);

        registry["registerInstrument"](this);
    }
}

type TestInstrumentFactory = (
    factory: InstrumentFactory,
    name: string,
    description: string,
    options?: InstrumentOptions,
) => Instrument;

const instruments: [string, TestInstrumentFactory][] = [
    ["counter", (factory, name, description, options) => factory.createCounter(name, description, options)],
    ["gauge", (factory, name, description, options) => factory.createGauge(name, description, options)],
    [
        "histogram",
        (factory, name, description, options) =>
            factory.createHistogram(name, description, { ...options, buckets: [1, 2, 3] }),
    ],
];

describe.each(instruments)("Instrument: %s", (name, createInstrument) => {
    describe("Names and Duplication", () => {
        it("should create a counter with the given name and description", () => {
            // Arrange
            const metrics = new Metrics();
            const registry = metrics.createRegistry();

            // Act
            const counter = createInstrument(registry, "name", "description");

            // Assert
            expect(counter.name).toBe("name");
            expect(counter.description).toBe("description");
        });

        it("should throw error when creating counter with duplicate name in metrics root", () => {
            // Arrange
            const metrics = new Metrics();
            createInstrument(metrics, "name", "description");

            // Act
            // Assert
            expect(() => createInstrument(metrics, "name", "description")).toThrowError();
        });

        it("should throw error when creating counter with duplicate name in same registry", () => {
            // Arrange
            const metrics = new Metrics();
            const registry = metrics.createRegistry();

            createInstrument(registry, "name", "description");

            // Act
            // Assert
            expect(() => createInstrument(registry, "name", "description")).toThrowError();
        });

        it("should throw error when creating counter with duplicate name across registries", () => {
            // Arrange
            const metrics = new Metrics();
            const registry1 = metrics.createRegistry();
            const registry2 = metrics.createRegistry();

            createInstrument(registry1, "name", "description");

            // Act
            // Assert
            expect(() => createInstrument(registry2, "name", "description")).toThrowError();
        });

        it("should throw error when creating counter with duplicate prefixed name", () => {
            // Arrange
            const metrics = new Metrics();
            const registry = metrics.createRegistry({ commonPrefix: "prefix_" });

            createInstrument(registry, "name", "description");

            // Act
            // Assert
            expect(() => createInstrument(metrics, "prefix_name", "description")).toThrowError();
        });
    });

    describe("Options", () => {
        it("should have undefined TTL when not specified", () => {
            // Arrange
            const metrics = new Metrics();
            const registry = metrics.createRegistry({});

            // Act
            const counter = createInstrument(registry, "name", "description");

            // Assert
            expect(counter.options.ttl).toBeUndefined();
        });

        it("should use ttl from options", () => {
            // Arrange
            const metrics = new Metrics();
            const registry = metrics.createRegistry();

            // Act
            const counter = createInstrument(registry, "name", "description", { ttl: 60000 });

            // Assert
            expect(counter.options.ttl).toBe(60000);
        });

        it("should use the default TTL from the registry", () => {
            // Arrange
            const metrics = new Metrics();
            const registry = metrics.createRegistry({ defaultTtl: 60000 });

            // Act
            const counter = createInstrument(registry, "name", "description");

            // Assert
            expect(counter.options.ttl).toBe(60000);
        });

        it("should use the default TTL from the root", () => {
            // Arrange
            const metrics = new Metrics({ defaultTtl: 60000 });
            const registry = metrics.createRegistry();

            // Act
            const counter = createInstrument(registry, "name", "description");

            // Assert
            expect(counter.options.ttl).toBe(60000);
        });

        it("should use prefix from root", () => {
            // Arrange
            const metrics = new Metrics({ commonPrefix: "prefix_" });
            const registry = metrics.createRegistry();

            // Act
            const counter = createInstrument(registry, "name", "description");

            // Assert
            expect(counter.name).toBe("prefix_name");
        });

        it("should use prefix from registry", () => {
            // Arrange
            const metrics = new Metrics();
            const registry = metrics.createRegistry({ commonPrefix: "prefix_" });

            // Act
            const counter = createInstrument(registry, "name", "description");

            // Assert
            expect(counter.name).toBe("prefix_name");
        });

        it("should use common labels from root", () => {
            // Arrange
            const metrics = new Metrics({ commonLabels: { key: "value" } });
            const registry = metrics.createRegistry();

            // Act
            const counter = createInstrument(registry, "name", "description");

            // Assert
            expect(counter.options.commonLabels).toEqual({ key: "value" });
        });

        it("should use common labels from registry", () => {
            // Arrange
            const metrics = new Metrics();
            const registry = metrics.createRegistry({ commonLabels: { key: "value" } });

            // Act
            const counter = createInstrument(registry, "name", "description");

            // Assert
            expect(counter.options.commonLabels).toEqual({ key: "value" });
        });
    });

    describe("removal", () => {
        it("should remove a value with empty labels", () => {
            // Arrange
            const metrics = new Metrics();
            const instrument = new TestInstrument("name", "description", metrics.defaultRegistry);

            // Act
            instrument.updateValue({}, () => 3);
            instrument.remove({});

            // Assert
            expect(instrument.getValue({})).toBe(undefined);
        });

        it("should remove a value with labels", () => {
            // Arrange
            const metrics = new Metrics();
            const instrument = new TestInstrument("name", "description", metrics.defaultRegistry);

            // Act
            instrument.updateValue({ key: "value" }, () => 3);
            instrument.remove({ key: "value" });

            // Assert
            expect(instrument.getValue({ key: "value" })).toBe(undefined);
        });

        it("should only remove the value with the same labels", () => {
            // Arrange
            const metrics = new Metrics();
            const instrument = new TestInstrument("name", "description", metrics.defaultRegistry);

            // Act
            instrument.updateValue({ key: "value" }, () => 3);
            instrument.updateValue({ key: "value2" }, () => 5);
            instrument.remove({ key: "value" });

            // Assert
            expect(instrument.getValue({ key: "value" })).toBe(undefined);
            expect(instrument.getValue({ key: "value2" })).toBe(5);
        });

        it("should remove all values when clearing", () => {
            // Arrange
            const metrics = new Metrics();
            const instrument = new TestInstrument("name", "description", metrics.defaultRegistry);

            // Act
            instrument.updateValue({ key: "value" }, () => 3);
            instrument.updateValue({ key: "value2" }, () => 5);
            instrument.clear();

            // Assert
            expect(instrument.getValue({ key: "value" })).toBe(undefined);
            expect(instrument.getValue({ key: "value2" })).toBe(undefined);
        });
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
