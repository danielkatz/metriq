import { CounterImpl } from "../instruments/counter";
import { GaugeImpl } from "../instruments/gauge";
import { HistogramImpl } from "../instruments/histogram";
import { MetricsImpl } from "../metrics";
import { Labels } from "../types";

export interface PrometheusExporter {
    stream(): AsyncGenerator<string>;
}

export class PrometheusExporterImpl implements PrometheusExporter {
    private metrics: MetricsImpl;

    constructor(metrics: MetricsImpl) {
        this.metrics = metrics;
    }

    public stream(): AsyncGenerator<string> {
        return this.writeMetrics();
    }

    private async *writeMetrics(): AsyncGenerator<string> {
        let isFirst = true;

        for await (const instrument of this.metrics.collect()) {
            if (isFirst) {
                isFirst = false;
            } else {
                yield "\n";
            }

            if (instrument instanceof CounterImpl) {
                yield* this.writeCounter(instrument);
            } else if (instrument instanceof GaugeImpl) {
                yield* this.writeGauge(instrument);
            } else if (instrument instanceof HistogramImpl) {
                yield* this.writeHistogram(instrument);
            } else {
                throw new Error(`Unknown instrument type: ${instrument.constructor.name}`);
            }
        }
    }

    private *writeCounter(counter: CounterImpl): Generator<string> {
        yield `# HELP ${counter.description}\n`;
        yield `# TYPE counter\n`;

        for (const { labels, value } of counter.getInstrumentValues()) {
            yield `${counter.name}${this.writeLabels(labels)} ${value}\n`;
        }
    }

    private *writeGauge(instrument: GaugeImpl): Generator<string> {
        yield `# HELP ${instrument.description}\n`;
        yield `# TYPE gauge\n`;

        for (const { labels, value } of instrument.getInstrumentValues()) {
            yield `${instrument.name}${this.writeLabels(labels)} ${value}\n`;
        }
    }

    private *writeHistogram(histogram: HistogramImpl): Generator<string> {
        yield `# HELP ${histogram.description}\n`;
        yield `# TYPE histogram\n`;

        for (const { labels, value } of histogram.getInstrumentValues()) {
            const sum = value[value.length - 1];
            const count = value[value.length - 2];
            const buckets = value.slice(0, value.length - 2);

            for (let i = 0; i < histogram.buckets.length; i++) {
                yield `${histogram.name}_bucket${this.writeLabels({ ...labels, le: histogram.buckets[i].toString() })} ${buckets[i]}\n`;
            }

            yield `${histogram.name}_bucket${this.writeLabels({ ...labels, le: "+Inf" })} ${buckets[buckets.length - 1]}\n`;

            yield `${histogram.name}_sum${this.writeLabels(labels)} ${sum}\n`;
            yield `${histogram.name}_count${this.writeLabels(labels)} ${count}\n`;
        }
    }

    private writeLabels(labels: Labels): string {
        const keys = Object.keys(labels);
        const len = keys.length;
        if (len === 0) {
            return "";
        }

        const segments = new Array<string>(len);

        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const value = labels[key];
            segments[i] = `${key}="${value}"`;
        }

        return `{${segments.join(",")}}`;
    }
}
