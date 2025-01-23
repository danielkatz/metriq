import { InternalMetrics } from "../internal-metrics";
import { Registry, RegistryImpl } from "../registry";
import { Labels } from "../types";
import { generateKey } from "../utils";

export type ValueUpdater<TValue> = (value: TValue | undefined) => TValue;

export type InstrumentOptions = {
    ttl?: number;
    commonLabels?: Record<string, string>;
};

export type InstrumentValue<TValue> = {
    labels: Readonly<Labels>;
    expireAt?: number;
    value: TValue;
};

const DEFAULT_OPTIONS: InstrumentOptions = {};

export interface Instrument {
    readonly name: string;
    readonly description: string;
    readonly registry: Registry;

    remove(labels: Labels): void;
    clear(): void;
}

export abstract class InstrumentImpl<TValue = unknown, TOptions extends InstrumentOptions = InstrumentOptions>
    implements Instrument
{
    public readonly options: Readonly<TOptions>;

    private readonly values: Map<string, InstrumentValue<TValue>> = new Map();
    private readonly internalMetrics: InternalMetrics;
    protected componentsCount: number = 1;

    constructor(
        public readonly name: string,
        public readonly description: string,
        public readonly registry: RegistryImpl,
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

        if (this.options.ttl) {
            instrumentValue.expireAt = Date.now() + this.options.ttl;
        }

        this.values.set(key, instrumentValue);

        if (isNew) {
            this.internalMetrics.onTimeseriesAdded(this.name, this.componentsCount);
        }
    }

    public getValue(labels: Labels): TValue | undefined {
        const key = generateKey(labels);
        return this.getInstrumentValueWithTTL(key)?.value;
    }

    public remove(labels: Labels): void {
        const key = generateKey(labels);
        this.removeValue(key);
    }

    public clear(): void {
        const instrumentCount = this.getInstrumentValueCount();
        this.values.clear();
        this.internalMetrics.onTimeseriesRemoved(this.name, instrumentCount, this.componentsCount);
    }

    private removeValue(key: string): void {
        if (this.values.delete(key)) {
            this.internalMetrics.onTimeseriesRemoved(this.name, 1, this.componentsCount);
        }
    }

    private getInstrumentValueWithTTL(key: string): InstrumentValue<TValue> | undefined {
        if (this.options.ttl) {
            const instrumentValue = this.values.get(key);
            if (instrumentValue?.expireAt && instrumentValue.expireAt < Date.now()) {
                this.removeValue(key);
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
        for (const [key, instrumentValue] of this.values) {
            if (instrumentValue.expireAt && instrumentValue.expireAt < now) {
                this.removeValue(key);
            }
        }
    }

    private validateLabels(labels: Labels): void {
        if ("__name__" in labels) {
            throw new Error("Label __name__ is reserved");
        }
    }

    public getInstrumentValueCount(): number {
        return this.values.size;
    }
}
