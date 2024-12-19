import { Registry } from "../registry";
import { generateKey, parseKey } from "../utils";

export type ValueUpdater<TValue> = (value: TValue | undefined) => TValue;

export type InstrumentOptions = {
    ttl?: number;
};

export abstract class Instrument<TValue = unknown> {
    public readonly options: InstrumentOptions;

    private readonly values: Map<string, TValue> = new Map();
    private readonly ttls: Map<string, number> = new Map();

    protected readonly defaultOptions: InstrumentOptions = {};

    constructor(
        public readonly name: string,
        public readonly description: string,
        public readonly registry: Registry,
        options: InstrumentOptions = {},
    ) {
        this.options = {
            ...this.defaultOptions,
            ...options,
        };
    }

    public updateValue(labels: Labels, updater: ValueUpdater<TValue>): void {
        this.validateLabels(labels);

        const key = generateKey(labels);

        const value = this.getValueWithTTL(key);
        const newValue = updater(value);
        this.values.set(key, newValue);

        if (this.options.ttl) {
            this.ttls.set(key, Date.now() + this.options.ttl);
        }
    }

    public getValue(labels: Labels): TValue | undefined {
        const key = generateKey(labels);
        return this.getValueWithTTL(key);
    }

    private getValueWithTTL(key: string): TValue | undefined {
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

    public *getValues(): Generator<[Labels, TValue]> {
        for (const [key, value] of this.values) {
            const labels = parseKey(key);
            yield [labels, value];
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
