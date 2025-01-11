import { InternalMetrics } from "../internal-metrics";
import { Registry } from "../registry";
import { generateKey } from "../utils";

export type ValueUpdater<TValue> = (value: TValue | undefined) => TValue;

export type InstrumentOptions = {
    ttl?: number;
    commonLabels?: Record<string, string>;
};

export type InstrumentValue<TValue> = {
    labels: Readonly<Labels>;
    value: TValue;
};

const DEFAULT_OPTIONS: InstrumentOptions = {};

export abstract class Instrument<TValue = unknown, TOptions extends InstrumentOptions = InstrumentOptions> {
    public readonly options: Readonly<TOptions>;

    private readonly values: Map<string, InstrumentValue<TValue>> = new Map();
    private readonly ttls: Map<string, number> = new Map();
    private readonly internalMetrics: InternalMetrics;
    protected componentsCount: number = 1;

    constructor(
        public readonly name: string,
        public readonly description: string,
        public readonly registry: Registry,
        options: Partial<TOptions> = {},
    ) {
        this.options = Object.freeze({
            ...DEFAULT_OPTIONS,
            ...options,
        }) as TOptions;

        this.internalMetrics = registry.owner.internalMetrics;
    }

    public updateValue(labels: Labels, updater: ValueUpdater<TValue>): void {
        this.validateLabels(labels);

        const key = generateKey(labels);

        let instrumentValue = this.getInstrumentValueWithTTL(key);
        let isNew = false;
        const newValue = updater(instrumentValue?.value);

        if (instrumentValue === undefined) {
            const mergedLabels = { ...this.options.commonLabels, ...labels };
            instrumentValue = {
                labels: Object.freeze(mergedLabels),
                value: newValue,
            };
            isNew = true;
        } else {
            instrumentValue.value = newValue;
        }

        this.values.set(key, instrumentValue);

        if (this.options.ttl) {
            this.ttls.set(key, Date.now() + this.options.ttl);
        }

        if (isNew) {
            this.internalMetrics.onTimeseriesAdded(this.name, this.componentsCount);
        }
    }

    public getValue(labels: Labels): TValue | undefined {
        const key = generateKey(labels);
        return this.getInstrumentValueWithTTL(key)?.value;
    }

    private getInstrumentValueWithTTL(key: string): InstrumentValue<TValue> | undefined {
        if (this.options.ttl) {
            const ttl = this.ttls.get(key);
            if (ttl && ttl < Date.now()) {
                this.values.delete(key);
                this.ttls.delete(key);
                return undefined;
            }
        }

        return this.values.get(key);
    }

    public *getInstrumentValues(): Generator<InstrumentValue<TValue>> {
        for (const value of this.values.values()) {
            yield value;
        }
    }

    public clearExpiredValues(): void {
        if (!this.options.ttl) {
            return;
        }

        const now = Date.now();
        for (const [key, ttl] of this.ttls) {
            if (ttl < now) {
                this.values.delete(key);
                this.ttls.delete(key);
            }
        }
    }

    private validateLabels(labels: Labels): void {
        if ("__name__" in labels) {
            throw new Error("Label __name__ is reserved");
        }
    }
}
