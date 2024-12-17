import { Counter } from "./instruments/counter";
import { Instrument, InstrumentOptions } from "./instruments/instrument";
import { InstrumentFactory } from "./instruments/factory";
import { Metrics } from "./metrics";
import { Histogram } from "./instruments/histogram";

export type RegistryOptions = {
    defaultTtl?: number;
};

export class Registry implements InstrumentFactory {
    public readonly owner: Metrics;
    public readonly options: RegistryOptions;
    private readonly instruments: Map<string, Instrument> = new Map();

    constructor(owner: Metrics, options?: RegistryOptions) {
        this.owner = owner;
        this.options = { defaultTtl: owner.options.defaultTtl, ...options };
    }

    public createCounter(name: string, description: string, options?: InstrumentOptions): Counter {
        const counter = new Counter(name, description, this, options);
        this.registerInstrument(counter);
        return counter;
    }

    public createHistogram(
        name: string,
        description: string,
        buckets: number[],
        options?: InstrumentOptions,
    ): Histogram {
        const histogram = new Histogram(name, description, buckets, this, options);
        this.registerInstrument(histogram);
        return histogram;
    }

    private registerInstrument(instrument: Instrument): void {
        this.instruments.set(instrument.name, instrument);
    }

    public getInstruments(): IterableIterator<Instrument> {
        return this.instruments.values();
    }
}
