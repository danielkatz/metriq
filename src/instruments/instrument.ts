import { Registry } from "../registry";

type Key = Labels & { __name__: string };

export type ValueUpdater<TValue> = (value: TValue | undefined) => TValue;

export abstract class Instrument<TValue = unknown> {
    private values: Map<string, TValue> = new Map();

    constructor(
        public name: string,
        public description: string,
        public requiredLabels: string[],
        public registry: Registry,
    ) {
        this.registry.register(this);
    }

    public updateValue(labels: Labels, updater: ValueUpdater<TValue>): void {
        const key = this.generateKey(labels);
        const value = this.values.get(key);
        const newValue = updater(value);
        this.values.set(key, newValue);
    }

    public getValue(labels: Labels): TValue | undefined {
        const key = this.generateKey(labels);
        return this.values.get(key);
    }

    private generateKey(labels: Labels): string {
        this.validateLabels(labels);

        const sortedKeys = Object.keys(labels).sort();
        const finalLabels = Object.fromEntries(sortedKeys.map((key) => [key, labels[key]]));

        return JSON.stringify(finalLabels);
    }

    public parseKey(key: string): Labels {
        const labels = JSON.parse(key) as Key;
        return labels;
    }

    private validateLabels(labels: Labels): void {
        if ("__name__" in labels) {
            throw new Error("Label __name__ is reserved");
        }
    }

    public *getValues(): Generator<[Labels, TValue]> {
        for (const [key, value] of this.values) {
            const labels = this.parseKey(key);
            yield [labels, value];
        }
    }
}
