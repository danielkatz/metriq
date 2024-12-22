import { InstrumentOptions } from "./instrument";
import { Counter } from "./counter";
import { Gauge } from "./gauge";
import { Histogram } from "./histogram";

export interface InstrumentFactory extends CounterFactory, GaugeFactory, HistogramFactory {}

interface CounterFactory {
    createCounter: (name: string, description: string, options?: InstrumentOptions) => Counter;
}

interface GaugeFactory {
    createGauge: (name: string, description: string, options?: InstrumentOptions) => Gauge;
}

interface HistogramFactory {
    createHistogram: (name: string, description: string, buckets: number[], options?: InstrumentOptions) => Histogram;
}
