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

        for (const instrument of this.metrics.getInstruments()) {
            if (isFirst) {
                isFirst = false;
            } else {
                yield "\n";
            }

            if (instrument instanceof Counter) {
                yield* this.writeCounter(instrument);
            } else if (instrument instanceof Histogram) {
                yield* this.writeHistogram(instrument);
            } else {
                throw new Error(`Unknown instrument type: ${instrument.constructor.name}`);
            }
        }
    }

    private *writeCounter(counter: Counter): Generator<string> {
        yield `# HELP ${counter.description}\n`;
        yield `# TYPE counter\n`;

        for (const [labels, value] of counter.getValues()) {
            yield `${counter.name}${this.writeLabels(labels)} ${value}\n`;
        }
    }

    private *writeHistogram(histogram: Histogram): Generator<string> {
        yield `# HELP ${histogram.description}\n`;
        yield `# TYPE histogram\n`;

        for (const [labels, values] of histogram.getValues()) {
            const sum = values[values.length - 1];
            const count = values[values.length - 2];
            const buckets = values.slice(0, values.length - 2);

            yield `${histogram.name}_sum${this.writeLabels(labels)} ${sum}\n`;
            yield `${histogram.name}_count${this.writeLabels(labels)} ${count}\n`;

            for (let i = 0; i < histogram.buckets.length; i++) {
                yield `${histogram.name}_bucket${this.writeLabels({ ...labels, le: histogram.buckets[i].toString() })} ${buckets[i]}\n`;
            }

            yield `${histogram.name}_bucket${this.writeLabels({ ...labels, le: "+Inf" })} ${buckets[buckets.length - 1]}\n`;
        }
    }

    private writeLabels(labels: Labels): string {
        return `{${Object.entries(labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(",")}}`;
    }
}
