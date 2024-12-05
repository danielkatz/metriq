import { Instrument } from "./instrument";
import { Registry } from "../registry";

export class Counter extends Instrument<number> {
    constructor(name: string, description: string, requiredLabels: string[], registry: Registry) {
        super(name, description, requiredLabels, registry);
    }

    public increment(labels: Labels, delta: number = 1): void {
        this.updateValue(labels, (value) => (value ?? 0) + delta);
    }

    public getValue(labels: Labels): number | undefined {
        return super.getValue(labels);
    }
}
