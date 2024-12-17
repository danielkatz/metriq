import { InstrumentOptions } from "./instrument";
import { Counter } from "./counter";
import { Histogram } from "./histogram";

export interface InstrumentFactory extends CounterFactory, HistogramFactory {}

interface CounterFactory {
    createCounter: (name: string, description: string, options?: InstrumentOptions) => Counter;
}

interface HistogramFactory {
    createHistogram: (name: string, description: string, buckets: number[], options?: InstrumentOptions) => Histogram;
}
