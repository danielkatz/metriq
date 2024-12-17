import { Instrument, InstrumentOptions } from "./instruments/instrument";
import { InstrumentFactory } from "./instruments/factory";
import { Registry, RegistryOptions } from "./registry";
import { Histogram } from "./instruments/histogram";

export type MetricsOptions = {
    defaultTtl?: number;
};

export class Metrics implements InstrumentFactory {
    private readonly registries = new Set<Registry>();

    public readonly options: MetricsOptions;
    public readonly defaultRegistry: Registry;

    constructor(options?: MetricsOptions) {
        this.options = options ?? {};
        this.defaultRegistry = this.createRegistry();
    }

    public createRegistry(options?: RegistryOptions): Registry {
        const registry = new Registry(this, options);
        this.registries.add(registry);
        return registry;
    }

    public createHistogram(
        name: string,
        description: string,
        buckets: number[],
        options?: InstrumentOptions,
    ): Histogram {
        return this.defaultRegistry.createHistogram(name, description, buckets, options);
    }

    public createCounter(name: string, description: string, options?: InstrumentOptions) {
        return this.defaultRegistry.createCounter(name, description, options);
    }

    public *getInstruments(): Generator<Instrument> {
        for (const registry of this.registries.values()) {
            yield* registry.getInstruments();
        }
    }
}
