import { Counter } from "./instruments/counter";
import { Instrument, InstrumentOptions } from "./instruments/instrument";
import { InstrumentFactory } from "./instruments/factory";
import { Metrics } from "./metrics";
import { Histogram } from "./instruments/histogram";

export type RegistryOptions = {
    defaultTtl?: number;
    commonPrefix?: string;
    commonLabels?: Record<string, string>;
};

const DEFAULT_OPTIONS: RegistryOptions = {};

export class Registry implements InstrumentFactory {
    public readonly owner: Metrics;
    private readonly options: Readonly<RegistryOptions>;
    private readonly instruments: Map<string, Instrument> = new Map();

    constructor(owner: Metrics, options: RegistryOptions) {
        this.owner = owner;
        this.options = Object.freeze({ ...DEFAULT_OPTIONS, ...options });
    }

    public createCounter(name: string, description: string, options?: InstrumentOptions): Counter {
        const merged: InstrumentOptions = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const counter = new Counter(fullName, description, this, merged);
        this.registerInstrument(counter);
        return counter;
    }

    public createHistogram(
        name: string,
        description: string,
        buckets: number[],
        options?: InstrumentOptions,
    ): Histogram {
        const merged: InstrumentOptions = {
            ttl: this.options.defaultTtl,
            commonLabels: this.options.commonLabels,
            ...options,
        };
        const fullName = (this.options.commonPrefix ?? "") + name;

        if (this.owner.hasInstrumentName(fullName)) {
            throw new Error(`Instrument with name "${fullName}" already exists`);
        }

        const histogram = new Histogram(fullName, description, buckets, this, merged);
        this.registerInstrument(histogram);
        return histogram;
    }

    private registerInstrument(instrument: Instrument): void {
        this.instruments.set(instrument.name, instrument);
    }

    public hasInstrumentName(name: string): boolean {
        return this.instruments.has(name);
    }

    public getInstruments(): IterableIterator<Instrument> {
        return this.instruments.values();
    }
}
