import { Counter } from "../instruments/counter";
import { Histogram } from "../instruments/histogram";
import { Metrics } from "../metrics";

export class PrometheusExporter {
    private metrics: Metrics;

    constructor(metrics: Metrics) {
        this.metrics = metrics;
    }

    public write(): string {
        let result = "";

        for (const { instrument, labels, value } of this.metrics.getMetrics()) {
            if (instrument instanceof Counter) {
                result += this.writeCounter(labels, instrument);
            } else if (instrument instanceof Histogram) {
                result += this.writeHistogram(labels, instrument, value as number[]);
            } else {
                throw new Error(`Unknown instrument type: ${instrument.constructor.name}`);
            }
        }

        return result;
    }

    private writeCounter(labels: Labels, counter: Counter): string {
        return `
        # HELP ${counter.description}
        # TYPE counter
        ${counter.name}${this.writeLabels(labels)} ${counter.getValue(labels)}`;
    }

    private writeHistogram(labels: Labels, histogram: Histogram, values: number[]): string {
        const sum = values[values.length - 1];
        const count = values[values.length - 2];
        const buckets = values.slice(0, values.length - 2);

        let result = `
        # HELP ${histogram.description}
        # TYPE histogram
        ${histogram.name}_sum${this.writeLabels(labels)} ${sum}
        ${histogram.name}_count${this.writeLabels(labels)} ${count}`;

        for (let i = 0; i < histogram.buckets.length; i++) {
            result += `
            ${histogram.name}_bucket${this.writeLabels({ ...labels, le: histogram.buckets[i].toString() })} ${buckets[i]}`;
        }

        result += `
        ${histogram.name}_bucket${this.writeLabels({ ...labels, le: "+Inf" })} ${buckets[buckets.length - 1]}`;

        return result;
    }

    private writeLabels(labels: Labels): string {
        return `{${Object.entries(labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(", ")}}`;
    }
}
