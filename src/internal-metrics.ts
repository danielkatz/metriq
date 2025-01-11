import { Counter } from "./instruments/counter";
import { Registry } from "./registry";

export interface InternalMetrics {
    registerInstruments(): void;

    onInstrumentAdded(): void;
    onInstrumentRemoved(): void;
    onTimeseriesAdded(instrumentName: string, componentCount: number): void;
    onTimeseriesRemoved(instrumentName: string, componentCount: number): void;
}

export class InternalMetricsImpl implements InternalMetrics {
    private readonly registry: Registry;

    public readonly metricCounter: Counter;
    public readonly timeseriesCounter: Counter;
    public readonly sampleCounter: Counter;

    constructor(registry: Registry) {
        this.registry = registry;

        this.metricCounter = new Counter("metriq_metrics_total", "Total number of metrics", registry);

        this.timeseriesCounter = new Counter("metriq_timeseries_total", "Total number of timeseries", registry);

        this.sampleCounter = new Counter("metriq_samples_total", "Total number of samples", registry);
    }

    public registerInstruments() {
        this.registry["registerInstrument"](this.sampleCounter);
        this.registry["registerInstrument"](this.timeseriesCounter);
        this.registry["registerInstrument"](this.metricCounter);

        // Internal metrics need to be counted manually
        this.metricCounter.increment(this.registry.getInstrumentsCount());
    }

    public onInstrumentAdded() {
        this.metricCounter.increment();
    }

    public onInstrumentRemoved() {
        this.metricCounter.increment(-1);
    }

    public onTimeseriesAdded(instrumentName: string, componentCount: number) {
        this.timeseriesCounter.increment({ instrument: instrumentName }, 1);
        this.sampleCounter.increment({ instrument: instrumentName }, componentCount);
    }

    public onTimeseriesRemoved(instrumentName: string, componentCount: number) {
        this.timeseriesCounter.increment({ instrument: instrumentName }, -1);
        this.sampleCounter.increment({ instrument: instrumentName }, -componentCount);
    }
}

export class InternalMetricsNoop implements InternalMetrics {
    public registerInstruments() {}

    public onInstrumentAdded() {}
    public onInstrumentRemoved() {}
    public onTimeseriesAdded() {}
    public onTimeseriesRemoved() {}
}
