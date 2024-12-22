import { Instrument, InstrumentOptions } from "./instrument";
import { Registry } from "../registry";

export class Histogram extends Instrument<number[]> {
    public readonly buckets: number[];
    private componentsCount: number;

    constructor(name: string, description: string, buckets: number[], registry: Registry, options?: InstrumentOptions) {
        super(name, description, registry, options);
        this.buckets = buckets;
        this.componentsCount = buckets.length + 2;
    }

    observe(labels: Labels, value: number): void {
        this.updateValue(labels, (values) => {
            if (typeof values === "undefined") {
                values = new Array(this.componentsCount).fill(0);
            }

            for (let i = 0; i < this.buckets.length; i++) {
                if (value <= this.buckets[i]) {
                    values[i]++;
                    break;
                }
            }

            values[this.buckets.length]++; // +Inf bucket
            values[this.buckets.length + 1] += value; // sum

            return values;
        });
    }
}
