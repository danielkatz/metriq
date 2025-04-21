import { InstrumentOptions } from "./instrument";
import { Counter } from "./counter";
import { Gauge } from "./gauge";
import { Histogram, HistogramOptions } from "./histogram";
import { Labels } from "../types";
import { Summary, SummaryOptions } from "./summary";

export interface InstrumentFactory extends CounterFactory, GaugeFactory, HistogramFactory, SummaryFactory {}

interface CounterFactory {
    createCounter<T extends Labels>(
        name: string,
        description: string,
        options?: Partial<InstrumentOptions>,
    ): Counter<T>;
}

interface GaugeFactory {
    createGauge<T extends Labels>(name: string, description: string, options?: Partial<InstrumentOptions>): Gauge<T>;
}

interface HistogramFactory {
    createHistogram<T extends Labels>(
        name: string,
        description: string,
        options?: Partial<HistogramOptions>,
    ): Histogram<T>;
}

interface SummaryFactory {
    createSummary<T extends Labels>(name: string, description: string, options?: Partial<SummaryOptions>): Summary<T>;
}
