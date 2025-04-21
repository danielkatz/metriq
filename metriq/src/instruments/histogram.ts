import { Instrument, InstrumentImpl, InstrumentOptions } from "./instrument";
import { RegistryImpl } from "../registry";
import { HasRequiredKeys, Labels, RequiredLabels } from "../types";
import { getLabelsAndRequiredValue } from "../utils";

export type HistogramOptions = InstrumentOptions & {
    buckets: Readonly<number[]>;
};

export type HistogramDebugValue = {
    buckets: Readonly<Map<number, number>>;
    sum: number;
    count: number;
};

const DEFAULT_BUCKETS = Object.freeze([0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]);

interface BaseHistogram<T extends Labels> extends Instrument {
    getDebugValue(labels: RequiredLabels<T>): Readonly<HistogramDebugValue> | undefined;
}

interface HistogramWithRequiredLabels<T extends Labels> extends BaseHistogram<T> {
    observe(labels: RequiredLabels<T>, value: number): void;
}

interface HistogramWithOptionalLabels extends HistogramWithRequiredLabels<Labels> {
    observe(value: number): void;
    observe(labels: Labels, value: number): void;
}

export type Histogram<T extends Labels = Labels> =
    HasRequiredKeys<T> extends true ? HistogramWithRequiredLabels<T> : HistogramWithOptionalLabels;

export class HistogramImpl<T extends Labels = Labels>
    extends InstrumentImpl<number[]>
    implements HistogramWithOptionalLabels
{
    public readonly buckets: Readonly<number[]>;

    constructor(name: string, description: string, registry: RegistryImpl, options?: Partial<HistogramOptions>) {
        super(name, description, registry, options);
        this.buckets = DEFAULT_BUCKETS;

        if (options?.buckets) {
            if (!Array.isArray(options.buckets)) {
                throw new Error("Buckets must be an array");
            }

            if (options.buckets.length === 0) {
                throw new Error("Buckets must be an array of numbers");
            }

            if (options.buckets.some((b) => typeof b !== "number" || b <= 0)) {
                throw new Error("Buckets must be an array of positive numbers");
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            this.buckets = [...options.buckets];
        }

        this.componentsCount = this.buckets.length + 2;
    }

    public observe(value: number): void;
    public observe(labels: RequiredLabels<T>, value: number): void;
    public observe(labelsOrValue?: number | RequiredLabels<T>, maybeValue?: number): void {
        const [labels = {}, value] = getLabelsAndRequiredValue(labelsOrValue, maybeValue);

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

    public getDebugValue(labels: RequiredLabels<T>): Readonly<HistogramDebugValue> | undefined {
        const values = super.getValue(labels);
        if (typeof values === "undefined") {
            return undefined;
        }

        const buckets = new Map<number, number>();
        for (let i = 0; i < this.buckets.length; i++) {
            buckets.set(this.buckets[i], values[i]);
        }

        return {
            buckets: buckets,
            sum: values[this.buckets.length],
            count: values[this.buckets.length + 1],
        };
    }
}
