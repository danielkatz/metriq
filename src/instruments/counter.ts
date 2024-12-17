import { Instrument, InstrumentOptions } from "./instrument";
import { Registry } from "../registry";

export class Counter extends Instrument<number> {
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
