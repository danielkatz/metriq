import { Counter } from "./instruments/counter";
import { Gauge, GaugeImpl } from "./instruments/gauge";
import { RegistryImpl } from "./registry";

export interface AdapterMetrics {
    readonly scrapeCount?: Counter;
    readonly scrapeBytesGauge?: Gauge;
    readonly scrapeDurationGauge?: Gauge;

    onScrape(bytes: number, durationSeconds: number): void;
}

export interface InternalMetrics extends AdapterMetrics {
    registerInstruments(): void;

    onInstrumentAdded(): void;
    onInstrumentRemoved(): void;
    onTimeseriesAdded(instrumentName: string, componentCount: number): void;
    onTimeseriesRemoved(instrumentName: string, instrumentCount: number, componentCount: number): void;
}

type MetricLabels = {
    instrument: string;
};

export class InternalMetricsImpl implements InternalMetrics {
    private readonly registry: RegistryImpl;

    public readonly metricGauge: GaugeImpl;
    public readonly timeseriesGauge: GaugeImpl<MetricLabels>;
    public readonly sampleGauge: GaugeImpl<MetricLabels>;

    public scrapeBytesGauge!: Gauge;
    public scrapeDurationGauge!: Gauge;
    public scrapeCount!: Counter;

    constructor(registry: RegistryImpl) {
        this.registry = registry;

        this.metricGauge = new GaugeImpl("metriq_metrics_count", "Current number of metrics registered", registry);
        this.timeseriesGauge = new GaugeImpl<MetricLabels>(
            "metriq_timeseries_count",
            "Current number of timeseries registered",
            registry,
        );
        this.sampleGauge = new GaugeImpl<MetricLabels>(
            "metriq_samples_count",
            "Current number of samples registered",
            registry,
        );
    }

    public registerInstruments() {
        this.registry["registerInstrument"](this.sampleGauge);
        this.registry["registerInstrument"](this.timeseriesGauge);
        this.registry["registerInstrument"](this.metricGauge);

        // Meta metrics need to be counted manually
        this.metricGauge.increment(this.registry.getInstrumentsCount());

        // Scrape metrics
        this.scrapeCount = this.registry.createCounter("metriq_scrapes_total", "Number of scrapes since startup");
        this.scrapeBytesGauge = this.registry.createGauge(
            "metriq_last_scrape_bytes",
            "Bytes returned during last scrape",
        );
        this.scrapeDurationGauge = this.registry.createGauge(
            "metriq_last_scrape_duration_seconds",
            "Duration of last scrape in seconds",
        );
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

    public onScrape(bytes: number, durationSeconds: number) {
        this.scrapeCount.increment();
        this.scrapeBytesGauge.set(bytes);
        this.scrapeDurationGauge.set(durationSeconds);
    }
}

export class InternalMetricsNoop implements InternalMetrics {
    public registerInstruments() {}

    public onInstrumentAdded() {}
    public onInstrumentRemoved() {}
    public onTimeseriesAdded() {}
    public onTimeseriesRemoved() {}
    public onScrape() {}
}
