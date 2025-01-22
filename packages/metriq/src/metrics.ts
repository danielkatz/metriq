import { InstrumentImpl, InstrumentOptions } from "./instruments/instrument";
import { Registry, RegistryImpl, RegistryOptions } from "./registry";
import { CounterImpl } from "./instruments/counter";
import { GaugeImpl } from "./instruments/gauge";
import { HistogramImpl, HistogramOptions } from "./instruments/histogram";
import { InternalMetrics, InternalMetricsImpl, InternalMetricsNoop } from "./internal-metrics";
import { Labels } from "./types";
import { InstrumentFactory } from "./instruments/factory";

export type MetricsOptions = {
    defaultTtl?: number;
    commonPrefix?: string;
    commonLabels?: Record<string, string>;
    enableInternalMetrics?: boolean;
};

export type CollectCallback = () => void | Promise<void>;

const DEFAULT_OPTIONS: MetricsOptions = {
    enableInternalMetrics: true,
};

export interface Metrics extends InstrumentFactory {
    readonly defaultRegistry: Registry;

    createRegistry(options?: Partial<RegistryOptions>): Registry;

    addCollectCallback(callback: CollectCallback): void;
    removeCollectCallback(callback: CollectCallback): void;
}

export class MetricsImpl implements Metrics {
    private readonly registries = new Set<RegistryImpl>();
    private readonly collectCallbacks = new Set<CollectCallback>();
    private readonly internalRegistry: RegistryImpl;

    public readonly options: Readonly<MetricsOptions>;
    public readonly defaultRegistry: RegistryImpl;
    public readonly internalMetrics: InternalMetrics;

    constructor(options?: Partial<MetricsOptions>) {
        this.options = Object.freeze({ ...DEFAULT_OPTIONS, ...options });
        this.defaultRegistry = this.createRegistry();
        this.internalRegistry = this.createRegistry();

        this.internalMetrics = new InternalMetricsNoop();

        if (this.options.enableInternalMetrics) {
            const active = new InternalMetricsImpl(this.internalRegistry);
            active.registerInstruments();
            this.internalMetrics = active;
        }
    }

    public createRegistry(options?: RegistryOptions): RegistryImpl {
        const merged: RegistryOptions = {
            defaultTtl: this.options.defaultTtl,
            commonPrefix: this.options.commonPrefix,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const registry = new RegistryImpl(this, merged);
        this.registries.add(registry);
        return registry;
    }

    public createCounter<T extends Labels = Labels>(
        name: string,
        description: string,
        options?: Partial<InstrumentOptions>,
    ): CounterImpl<T> {
        return this.defaultRegistry.createCounter(name, description, options);
    }

    public createGauge<T extends Labels = Labels>(
        name: string,
        description: string,
        options?: Partial<InstrumentOptions>,
    ): GaugeImpl<T> {
        return this.defaultRegistry.createGauge(name, description, options);
    }

    public createHistogram<T extends Labels = Labels>(
        name: string,
        description: string,
        options?: Partial<HistogramOptions>,
    ): HistogramImpl<T> {
        return this.defaultRegistry.createHistogram(name, description, options);
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

    public async *collect(): AsyncGenerator<InstrumentImpl> {
        for (const callback of this.collectCallbacks) {
            await Promise.resolve(callback());
        }

        for (const registry of this.registries.values()) {
            for (const instrument of registry.getInstruments()) {
                yield instrument;
            }
        }
    }
}
