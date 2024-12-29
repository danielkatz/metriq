import { Instrument, InstrumentOptions } from "./instruments/instrument";
import { InstrumentFactory } from "./instruments/factory";
import { Registry, RegistryOptions } from "./registry";
import { Counter } from "./instruments/counter";
import { Gauge } from "./instruments/gauge";
import { Histogram } from "./instruments/histogram";

export type MetricsOptions = {
    defaultTtl?: number;
    commonPrefix?: string;
    commonLabels?: Record<string, string>;
};

export type CollectCallback = () => void | Promise<void>;

const DEFAULT_OPTIONS: MetricsOptions = {};

export class Metrics implements InstrumentFactory {
    private readonly registries = new Set<Registry>();
    private readonly collectCallbacks = new Set<CollectCallback>();

    public readonly options: Readonly<MetricsOptions>;
    public readonly defaultRegistry: Registry;

    constructor(options?: Partial<MetricsOptions>) {
        this.options = Object.freeze({ ...DEFAULT_OPTIONS, ...options });
        this.defaultRegistry = this.createRegistry();
    }

    public createRegistry(options?: RegistryOptions): Registry {
        const merged: RegistryOptions = {
            defaultTtl: this.options.defaultTtl,
            commonPrefix: this.options.commonPrefix,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const registry = new Registry(this, merged);
        this.registries.add(registry);
        return registry;
    }

    public createCounter(name: string, description: string, options?: InstrumentOptions): Counter {
        return this.defaultRegistry.createCounter(name, description, options);
    }

    public createGauge(name: string, description: string, options?: InstrumentOptions): Gauge {
        return this.defaultRegistry.createGauge(name, description, options);
    }

    public createHistogram(
        name: string,
        description: string,
        buckets: number[],
        options?: InstrumentOptions,
    ): Histogram {
        return this.defaultRegistry.createHistogram(name, description, buckets, options);
    }

    public addCollectCallback(callback: CollectCallback): void {
        this.collectCallbacks.add(callback);
    }

    public removeCollectCallback(callback: CollectCallback): void {
        this.collectCallbacks.delete(callback);
    }

    public hasInstrumentName(name: string): boolean {
        for (const registry of this.registries.values()) {
            if (registry.hasInstrumentName(name)) {
                return true;
            }
        }

        return false;
    }

    public async *collect(): AsyncGenerator<Instrument> {
        for (const callback of this.collectCallbacks) {
            await Promise.resolve(callback());
        }

        for (const registry of this.registries.values()) {
            yield* registry.getInstruments();
        }
    }
}
