import { Registry, ValueInitiator, ValueUpdater } from "../registry";

type Key = Labels & { __name__: string };

export abstract class Instrument<TValue = unknown> {
    constructor(
        public name: string,
        public description: string,
        public requiredLabels: string[],
        public registry: Registry,
    ) {}

    public updateValue(labels: Labels, updater: ValueUpdater<TValue>): void {
        const key = this.generateKey(labels);
        if (this.registry.updateValue(key, updater) === null) {
            this.registry.initInstrumentValue(key, {
                instrument: this,
                value: updater(undefined),
            });
        }
    }

    public getValue(labels: Labels): TValue | undefined {
        const key = this.generateKey(labels);
        return this.registry.getValue<TValue>(key);
    }

    public getOrInitValue(labels: Labels, initiator: ValueInitiator<TValue>): TValue {
        const key = this.generateKey(labels);
        const value = this.registry.getValue<TValue>(key);
        if (typeof value === "undefined") {
            const initValue = initiator();
            this.registry.initInstrumentValue<TValue>(key, {
                instrument: this,
                value: initValue,
            });
            return initValue;
        }
        return value;
    }

    private generateKey(labels: Labels): string {
        this.validateLabels(labels);

        const allLabels: Key = { __name__: this.name, ...labels };
        const sortedKeys = Object.keys(allLabels).sort();
        const finalLabels = Object.fromEntries(sortedKeys.map((key) => [key, allLabels[key]]));

        return JSON.stringify(finalLabels);
    }

    public parseKey(key: string): [string, Labels] {
        const allLabels = JSON.parse(key) as Key;
        const { __name__, ...labels } = allLabels;
        return [__name__, labels];
    }

    private validateLabels(labels: Labels): void {
        if ("__name__" in labels) {
            throw new Error("Label __name__ is reserved");
        }
    }
}
