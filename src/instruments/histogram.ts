import { Instrument } from "./instrument";
import { Registry } from "../registry";

export class Histogram extends Instrument<number[]> {
    public readonly buckets: number[];
    private length: number;

    constructor(name: string, description: string, buckets: number[], requiredLabels: string[], registry: Registry) {
        super(name, description, requiredLabels, registry);
        this.buckets = buckets;
        this.length = buckets.length + 2;
    }

    observe(labels: Labels, value: number): void {
        this.updateValue(labels, (values) => {
            if (typeof values === "undefined") {
                values = new Array(this.length).fill(0);
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
