import { Instrument } from "./instruments/instrument";
import { Registry } from "./registry";

export type MetricsOptions = {
    defaultRegistry?: Registry;
    defaultTtl?: number;
};

export class Metrics {
    private readonly registries = new Set<Registry>();

    public readonly options: MetricsOptions;
    public readonly defaultRegistry: Registry;

    constructor(options?: MetricsOptions) {
        this.options = options ?? {};
        this.defaultRegistry = this.options.defaultRegistry ?? new Registry();

        this.addRegistry(this.defaultRegistry);
    }

    public addRegistry(registry: Registry): void {
        registry.setOwner(this);
        this.registries.add(registry);
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
