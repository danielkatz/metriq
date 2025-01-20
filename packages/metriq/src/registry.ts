import { InstrumentImpl, InstrumentOptions } from "./instruments/instrument";
import { Counter, CounterImpl } from "./instruments/counter";
import { Metrics, MetricsImpl } from "./metrics";
import { Gauge, GaugeImpl } from "./instruments/gauge";
import { Histogram, HistogramImpl, HistogramOptions } from "./instruments/histogram";

export type RegistryOptions = {
    defaultTtl?: number;
    commonPrefix?: string;
    commonLabels?: Record<string, string>;
};

const DEFAULT_OPTIONS: RegistryOptions = {};

export interface Registry {
    readonly owner: Metrics;

    createCounter(name: string, description: string, options?: Partial<InstrumentOptions>): Counter;
    createGauge(name: string, description: string, options?: Partial<InstrumentOptions>): Gauge;
    createHistogram(name: string, description: string, options?: Partial<HistogramOptions>): Histogram;
}

export class RegistryImpl implements Registry {
    public readonly owner: MetricsImpl;
    private readonly options: Readonly<RegistryOptions>;
    private readonly instruments: Map<string, InstrumentImpl> = new Map();

    constructor(owner: MetricsImpl, options: RegistryOptions) {
        this.owner = owner;
        this.options = Object.freeze({ ...DEFAULT_OPTIONS, ...options });
    }

    public createCounter(name: string, description: string, options?: Partial<InstrumentOptions>): CounterImpl {
        const merged: InstrumentOptions = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const counter = new CounterImpl(fullName, description, this, merged);
        this.registerInstrument(counter);
        return counter;
    }

    public createGauge(name: string, description: string, options?: Partial<InstrumentOptions>): GaugeImpl {
        const merged: InstrumentOptions = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const gauge = new GaugeImpl(fullName, description, this, merged);
        this.registerInstrument(gauge);
        return gauge;
    }

    public createHistogram(name: string, description: string, options?: Partial<HistogramOptions>): HistogramImpl {
        const merged: Partial<HistogramOptions> = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const histogram = new HistogramImpl(fullName, description, this, merged);
        this.registerInstrument(histogram);
        return histogram;
    }

    private registerInstrument(instrument: InstrumentImpl): void {
        this.instruments.set(instrument.name, instrument);

        this.owner.internalMetrics.onInstrumentAdded();
    }

    public hasInstrumentName(name: string): boolean {
        return this.instruments.has(name);
    }

    public getInstruments(): IterableIterator<InstrumentImpl> {
        return this.instruments.values();
    }

    public getInstrumentsCount(): number {
        return this.instruments.size;
    }
}
