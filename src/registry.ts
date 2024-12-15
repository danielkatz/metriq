import { Instrument } from "./instruments/instrument";
import { Metrics } from "./metrics";

export type RegistryOptions = {
    defaultTtl?: number;
};

export class Registry {
    private readonly instruments: Map<string, Instrument> = new Map();
    private readonly localOptions: RegistryOptions;

    private owner: Metrics | undefined;
    private effectiveOptions: RegistryOptions | undefined;

    constructor(options?: RegistryOptions) {
        this.localOptions = options ?? {};
    }

    public setOwner(metrics: Metrics): void {
        if (this.owner) {
            throw new Error("Registry already owned by another Metrics instance");
        }
        this.owner = metrics;

        this.effectiveOptions = {
            defaultTtl: this.localOptions.defaultTtl ?? metrics.options.defaultTtl,
        };
    }

    public registerInstrument(instrument: Instrument): void {
        if (!this.effectiveOptions) {
            throw new Error("Registry is not owned by any Metrics instance");
        }

        this.instruments.set(instrument.name, instrument);
    }

    public getInstruments(): IterableIterator<Instrument> {
        return this.instruments.values();
    }

    public getOptions(): RegistryOptions {
        if (!this.effectiveOptions) {
            throw new Error("Registry is not owned by any Metrics instance");
        }
        return this.effectiveOptions;
    }
}
