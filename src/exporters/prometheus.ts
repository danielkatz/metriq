import { Readable } from "node:stream";
import { Counter } from "../instruments/counter";
import { Histogram } from "../instruments/histogram";
import { Metrics } from "../metrics";

export class PrometheusExporter {
    private metrics: Metrics;

    constructor(metrics: Metrics) {
        this.metrics = metrics;
    }

    public stream(): Readable {
        return Readable.from(this.writeMetrics());
    }

    private *writeMetrics(): Generator<string> {
        let isFirst = true;

        for (const { instrument, labels, value } of this.metrics.getMetrics()) {
            if (isFirst) {
                isFirst = false;
            } else {
                yield "\n";
            }

            if (instrument instanceof Counter) {
                yield* this.writeCounter(labels, instrument);
            } else if (instrument instanceof Histogram) {
                yield* this.writeHistogram(labels, instrument, value as number[]);
            } else {
                throw new Error(`Unknown instrument type: ${instrument.constructor.name}`);
            }
        }
    }

    private *writeCounter(labels: Labels, counter: Counter): Generator<string> {
        yield `# HELP ${counter.description}\n`;
        yield `# TYPE counter\n`;
        yield `${counter.name}${this.writeLabels(labels)} ${counter.getValue(labels)}\n`;
    }

    private *writeHistogram(labels: Labels, histogram: Histogram, values: number[]): Generator<string> {
        const sum = values[values.length - 1];
        const count = values[values.length - 2];
        const buckets = values.slice(0, values.length - 2);

        yield `# HELP ${histogram.description}\n`;
        yield `# TYPE histogram\n`;
        yield `${histogram.name}_sum${this.writeLabels(labels)} ${sum}\n`;
        yield `${histogram.name}_count${this.writeLabels(labels)} ${count}\n`;

        for (let i = 0; i < histogram.buckets.length; i++) {
            yield `${histogram.name}_bucket${this.writeLabels({ ...labels, le: histogram.buckets[i].toString() })} ${buckets[i]}\n`;
        }

        yield `${histogram.name}_bucket${this.writeLabels({ ...labels, le: "+Inf" })} ${buckets[buckets.length - 1]}\n`;
    }

    private writeLabels(labels: Labels): string {
        return `{${Object.entries(labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(",")}}`;
    }
}
