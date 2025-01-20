import { Instrument, InstrumentImpl, InstrumentOptions } from "./instrument";
import { RegistryImpl } from "../registry";
import { Labels } from "../types";

export type HistogramOptions = InstrumentOptions & {
    buckets: Readonly<number[]>;
};

const DEFAULT_BUCKETS = Object.freeze([0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]);

export interface Histogram extends Instrument {
    observe(value: number): void;
    observe(labels: Labels, value: number): void;
}

export class HistogramImpl extends InstrumentImpl<number[], HistogramOptions> implements Histogram {
    public readonly buckets: Readonly<number[]>;

    constructor(name: string, description: string, registry: RegistryImpl, options?: InstrumentOptions) {
        super(name, description, registry, options);
        this.buckets = this.options.buckets ? Object.freeze(this.options.buckets) : DEFAULT_BUCKETS;
        this.componentsCount = this.buckets.length + 2;
    }

    public observe(value: number): void;
    public observe(labels: Labels, value: number): void;
    public observe(labelsOrValue?: number | Labels, maybeValue?: number): void {
        const [labels = {}, value] = this.getLabelsAndValue(labelsOrValue, maybeValue);

        this.updateValue(labels, (values) => {
            if (typeof values === "undefined") {
                values = new Array(this.componentsCount).fill(0);
            }

            for (let i = 0; i < this.buckets.length; i++) {
                if (value <= this.buckets[i]) {
                    values[i]++;
                }
            }

            values[this.buckets.length]++; // +Inf bucket
            values[this.buckets.length + 1] += value; // sum

            return values;
        });
    }

    private getLabelsAndValue(labelsOrValue?: number | Labels, maybeValue?: number): [Labels | undefined, number] {
        let labels: Labels | undefined;
        let value: number;

        if (typeof labelsOrValue === "number") {
            // Called as func(value)
            value = labelsOrValue;
        } else {
            // Called as func(labels, value)
            labels = labelsOrValue;
            value = maybeValue!;
        }

        return [labels, value];
    }
}
