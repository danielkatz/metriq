import { GaugeImpl } from "./instruments/gauge";
import { RegistryImpl } from "./registry";

export interface InternalMetrics {
    registerInstruments(): void;

    onInstrumentAdded(): void;
    onInstrumentRemoved(): void;
    onTimeseriesAdded(instrumentName: string, componentCount: number): void;
    onTimeseriesRemoved(instrumentName: string, instrumentCount: number, componentCount: number): void;
}

export class InternalMetricsImpl implements InternalMetrics {
    private readonly registry: RegistryImpl;

    public readonly metricGauge: GaugeImpl;
    public readonly timeseriesGauge: GaugeImpl;
    public readonly sampleGauge: GaugeImpl;

    constructor(registry: RegistryImpl) {
        this.registry = registry;

        this.metricGauge = new GaugeImpl("metriq_metrics_total", "Total number of metrics", registry);

        this.timeseriesGauge = new GaugeImpl("metriq_timeseries_total", "Total number of timeseries", registry);

        this.sampleGauge = new GaugeImpl("metriq_samples_total", "Total number of samples", registry);
    }

    public registerInstruments() {
        this.registry["registerInstrument"](this.sampleGauge);
        this.registry["registerInstrument"](this.timeseriesGauge);
        this.registry["registerInstrument"](this.metricGauge);

        // Internal metrics need to be counted manually
        this.metricGauge.increment(this.registry.getInstrumentsCount());
    }

    public onInstrumentAdded() {
        this.metricGauge.increment();
    }

    public onInstrumentRemoved() {
        this.metricGauge.decrement();
    }

    public onTimeseriesAdded(instrumentName: string, componentCount: number) {
        this.timeseriesGauge.increment({ instrument: instrumentName });
        this.sampleGauge.increment({ instrument: instrumentName }, componentCount);
    }

    public onTimeseriesRemoved(instrumentName: string, instrumentCount: number, componentCount: number) {
        this.timeseriesGauge.decrement({ instrument: instrumentName }, instrumentCount);
        this.sampleGauge.decrement({ instrument: instrumentName }, componentCount * instrumentCount);
    }
}

export class InternalMetricsNoop implements InternalMetrics {
    public registerInstruments() {}

    public onInstrumentAdded() {}
    public onInstrumentRemoved() {}
    public onTimeseriesAdded() {}
    public onTimeseriesRemoved() {}
}
