import { Instrument, InstrumentImpl, InstrumentOptions } from "./instrument";
import { RegistryImpl } from "../registry";
import { HasRequiredKeys, Labels, RequiredLabels } from "../types";

interface BaseGauge<T extends Labels> extends Instrument {
    getDebugValue(labels: RequiredLabels<T>): number | undefined;
}

interface GaugeWithRequiredLabels<T extends Labels> extends BaseGauge<T> {
    increment(labels: RequiredLabels<T>): void;
    increment(labels: RequiredLabels<T>, delta: number): void;

    decrement(labels: RequiredLabels<T>): void;
    decrement(labels: RequiredLabels<T>, delta: number): void;

    set(labels: RequiredLabels<T>, value: number): void;
}

interface GaugeWithOptionalLabels extends GaugeWithRequiredLabels<Labels> {
    increment(): void;
    increment(delta: number): void;
    increment(labels: Labels): void;
    increment(labels: Labels, delta: number): void;

    decrement(): void;
    decrement(delta: number): void;
    decrement(labels: Labels): void;
    decrement(labels: Labels, delta: number): void;

    set(value: number): void;
    set(labels: Labels, value: number): void;
}

export type Gauge<T extends Labels = Labels> =
    HasRequiredKeys<T> extends true ? GaugeWithRequiredLabels<T> : GaugeWithOptionalLabels;

export class GaugeImpl<T extends Labels = Labels> extends InstrumentImpl<number> implements GaugeWithOptionalLabels {
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

    public decrement(): void;
    public decrement(delta: number): void;
    public decrement(labels: RequiredLabels<T>): void;
    public decrement(labels: RequiredLabels<T>, delta: number): void;
    public decrement(labelsOrDelta?: number | RequiredLabels<T>, maybeDelta?: number): void {
        const [labels = {}, delta = 1] = this.getLabelsAndValue(labelsOrDelta, maybeDelta);
        this.updateValue(labels, (value = 0) => value - delta);
    }

    public set(value: number): void;
    public set(labels: RequiredLabels<T>, value: number): void;
    public set(labelsOrValue?: number | RequiredLabels<T>, maybeValue?: number): void {
        const [labels = {}, value = 0] = this.getLabelsAndValue(labelsOrValue, maybeValue);
        this.updateValue(labels, () => value);
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
