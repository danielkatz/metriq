import { InstrumentOptions } from "./instrument";
import { CounterImpl } from "./counter";
import { GaugeImpl } from "./gauge";
import { HistogramImpl, HistogramOptions } from "./histogram";

export interface InstrumentFactory extends CounterFactory, GaugeFactory, HistogramFactory {}

interface CounterFactory {
    createCounter: (name: string, description: string, options?: Partial<InstrumentOptions>) => CounterImpl;
}

interface GaugeFactory {
    createGauge: (name: string, description: string, options?: Partial<InstrumentOptions>) => GaugeImpl;
}

interface HistogramFactory {
    createHistogram: (name: string, description: string, options?: Partial<HistogramOptions>) => HistogramImpl;
}
