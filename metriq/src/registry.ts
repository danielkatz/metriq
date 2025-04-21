import { InstrumentImpl, InstrumentOptions } from "./instruments/instrument";
import { CounterImpl } from "./instruments/counter";
import { Metrics, MetricsImpl } from "./metrics";
import { GaugeImpl } from "./instruments/gauge";
import { HistogramImpl, HistogramOptions } from "./instruments/histogram";
import { Labels } from "./types";
import { InstrumentFactory } from "./instruments/factory";
import { SummaryImpl, SummaryOptions } from "./instruments/summary";

export type RegistryOptions = {
    defaultTtl?: number;
    commonPrefix?: string;
    commonLabels?: Record<string, string>;
};

const DEFAULT_OPTIONS: RegistryOptions = {};

export interface Registry extends InstrumentFactory {
    readonly owner: Metrics;
}

export class RegistryImpl implements Registry {
    public readonly owner: MetricsImpl;
    private readonly options: Readonly<RegistryOptions>;
    private readonly instruments: Map<string, InstrumentImpl> = new Map();

    constructor(owner: MetricsImpl, options: RegistryOptions) {
        this.owner = owner;
        this.options = Object.freeze({ ...DEFAULT_OPTIONS, ...options });
    }

    public createCounter<T extends Labels = Labels>(
        name: string,
        description: string,
        options?: Partial<InstrumentOptions>,
    ): CounterImpl<T> {
        const merged: InstrumentOptions = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const counter = new CounterImpl<T>(fullName, description, this, merged);
        this.registerInstrument(counter);
        return counter;
    }

    public createGauge<T extends Labels = Labels>(
        name: string,
        description: string,
        options?: Partial<InstrumentOptions>,
    ): GaugeImpl<T> {
        const merged: InstrumentOptions = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const gauge = new GaugeImpl<T>(fullName, description, this, merged);
        this.registerInstrument(gauge);
        return gauge;
    }

    public createHistogram<T extends Labels = Labels>(
        name: string,
        description: string,
        options?: Partial<HistogramOptions>,
    ): HistogramImpl<T> {
        const merged: Partial<HistogramOptions> = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const histogram = new HistogramImpl<T>(fullName, description, this, merged);
        this.registerInstrument(histogram);
        return histogram;
    }

    public createSummary<T extends Labels = Labels>(
        name: string,
        description: string,
        options?: SummaryOptions,
    ): SummaryImpl<T> {
        const merged: SummaryOptions = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const summary = new SummaryImpl<T>(fullName, description, this, merged);
        this.registerInstrument(summary);
        return summary;
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
