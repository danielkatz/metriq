import { Instrument, InstrumentImpl, InstrumentOptions } from "./instrument";
import { RegistryImpl } from "../registry";
import { HasRequiredKeys, Labels, RequiredLabels } from "../types";

interface BaseCounter<T extends Labels> extends Instrument {
    getDebugValue(labels: RequiredLabels<T>): number | undefined;
}

interface CounterWithRequiredLabels<T extends Labels> {
    increment(labels: RequiredLabels<T>): void;
    increment(labels: RequiredLabels<T>, delta: number): void;
}

interface CounterWithOptionalLabels {
    increment(): void;
    increment(delta: number): void;
    increment(labels: Labels): void;
    increment(labels: Labels, delta: number): void;
}

type ICounter<T extends Labels> = BaseCounter<T> & CounterWithOptionalLabels & CounterWithRequiredLabels<T>;

export type Counter<T extends Labels> = BaseCounter<T> &
    (HasRequiredKeys<T> extends true ? CounterWithRequiredLabels<T> : CounterWithOptionalLabels);

export class CounterImpl<T extends Labels = Labels> extends InstrumentImpl<number> implements ICounter<T> {
    constructor(name: string, description: string, registry: RegistryImpl, options?: InstrumentOptions) {
        super(name, description, registry, options);
    }

    public increment(): void;
    public increment(delta: number): void;
    public increment(labels: RequiredLabels<T>): void;
    public increment(labels: RequiredLabels<T>, delta: number): void;
    public increment(labelsOrDelta?: number | RequiredLabels<T>, maybeDelta?: number): void {
        const [labels = {}, delta = 1] = this.getLabelsAndValue(labelsOrDelta, maybeDelta);
        this.updateValue(labels, (value = 0) => value + delta);
    }

    public getValue(labels: RequiredLabels<T>): number | undefined {
        return super.getValue(labels);
    }

    public getDebugValue(labels: RequiredLabels<T>): number | undefined {
        return super.getValue(labels);
    }

    private getLabelsAndValue(
        labelsOrValue?: number | RequiredLabels<T>,
        maybeValue?: number,
    ): [RequiredLabels<T> | undefined, number | undefined] {
        let labels: RequiredLabels<T> | undefined;
        let value: number | undefined;

        if (typeof labelsOrValue === "number") {
            // Called as func(value)
            value = labelsOrValue;
        } else if (typeof labelsOrValue === "object") {
            // Called as func(labels) or func(labels, value)
            labels = labelsOrValue;
            if (typeof maybeValue === "number") {
                value = maybeValue;
            }
        }

        return [labels, value];
    }
}
