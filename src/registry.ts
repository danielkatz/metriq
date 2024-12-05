import { Instrument } from "./instruments/instrument";

export type InstrumentValue<TValue = unknown> = {
    instrument: Instrument;
    value: TValue;
};

export type ValueUpdater<TValue> = (value: TValue | undefined) => TValue;

export type ValueInitiator<TValue> = () => TValue;

export class Registry {
    private values: Map<string, InstrumentValue> = new Map();

    public initInstrumentValue<TValue>(key: string, instrumentValue: InstrumentValue<TValue>): void {
        if (this.values.has(key)) {
            throw new Error(`Instrument value with key ${key} already exists`);
        }
        this.values.set(key, instrumentValue);
    }

    public deleteInstrumentValue(key: string): void {
        this.values.delete(key);
    }

    public getValue<TValue>(key: string): TValue | undefined {
        const value = this.values.get(key);
        if (value === undefined) {
            return undefined;
        }
        return value.value as TValue;
    }

    public setValue<TValue>(key: string, value: TValue): TValue | null {
        const instrumentValue = this.values.get(key);
        if (instrumentValue === undefined) {
            return null;
        }
        instrumentValue.value = value;
        return value;
    }

    public updateValue<TValue>(key: string, updater: ValueUpdater<TValue>): TValue | null {
        const instrumentValue = this.values.get(key);
        if (instrumentValue === undefined) {
            return null;
        }
        const newValue = updater(instrumentValue.value as TValue);
        instrumentValue.value = newValue;
        return newValue;
    }

    public iterateValues(): IterableIterator<[string, InstrumentValue]> {
        return this.values.entries();
    }
}
