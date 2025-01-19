import { Instrument, InstrumentOptions } from "./instrument";
import { Registry } from "../registry";
import { Labels } from "../types";

export class Gauge extends Instrument<number> {
    constructor(name: string, description: string, registry: Registry, options?: InstrumentOptions) {
        super(name, description, registry, options);
    }

    public increment(): void;
    public increment(delta: number): void;
    public increment(labels: Labels): void;
    public increment(labels: Labels, delta: number): void;
    public increment(labelsOrDelta?: number | Labels, maybeDelta?: number): void {
        const [labels = {}, delta = 1] = this.getLabelsAndValue(labelsOrDelta, maybeDelta);
        this.updateValue(labels, (value = 0) => value + delta);
    }

    public decrement(): void;
    public decrement(delta: number): void;
    public decrement(labels: Labels): void;
    public decrement(labels: Labels, delta: number): void;
    public decrement(labelsOrDelta?: number | Labels, maybeDelta?: number): void {
        const [labels = {}, delta = 1] = this.getLabelsAndValue(labelsOrDelta, maybeDelta);
        this.updateValue(labels, (value = 0) => value - delta);
    }

    public set(value: number): void;
    public set(labels: Labels, value: number): void;
    public set(labelsOrValue?: number | Labels, maybeValue?: number): void {
        const [labels = {}, value = 0] = this.getLabelsAndValue(labelsOrValue, maybeValue);
        this.updateValue(labels, () => value);
    }

    public getValue(labels: Labels): number | undefined {
        return super.getValue(labels);
    }

    private getLabelsAndValue(
        labelsOrValue?: number | Labels,
        maybeValue?: number,
    ): [Labels | undefined, number | undefined] {
        let labels: Labels | undefined;
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
