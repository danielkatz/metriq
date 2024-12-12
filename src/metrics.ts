import { Instrument } from "./instruments/instrument";
import { Registry } from "./registry";

export type MetricEntry = {
    instrument: Instrument;
    labels: Labels;
    value: unknown;
};

export class Metrics {
    private registries: Registry[];

    constructor(registry?: Registry) {
        registry = registry || new Registry();
        this.registries = [registry];
    }

    public addRegistry(registry: Registry): void {
        this.registries.push(registry);
    }

    public removeRegistry(registry: Registry): void {
        const index = this.registries.indexOf(registry);
        if (index === -1) {
            throw new Error("Registry not found");
        }
        this.registries.splice(index, 1);
    }

    public getRegistries(): IterableIterator<Registry> {
        return this.registries.values();
    }

    public *getInstruments(): Generator<Instrument> {
        for (const registry of this.getRegistries()) {
            yield* registry.getInstruments();
        }
    }
}
