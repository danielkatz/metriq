import { Instrument, InstrumentImpl } from "../instrument";
import { RegistryImpl } from "../../registry";
import { HasRequiredKeys, Labels, RequiredLabels } from "../../types";
import { getLabelsAndRequiredValue } from "../../utils";
import { SummaryOptions, SummaryOptionsParsed, parseSummaryOptions } from "./options";
import { createDigestAlgorithm, DigestAlgorithm } from "./digest";

export type SummaryDebugValue = {
    percentiles: Readonly<Map<number, number>>;
    sum: number;
    count: number;
};

type SummaryValue = {
    digest: DigestAlgorithm;
    sum: number;
    count: number;
};

interface BaseSummary<T extends Labels> extends Instrument {
    getDebugValue(labels: RequiredLabels<T>): Readonly<SummaryDebugValue> | undefined;
}

interface SummaryWithRequiredLabels<T extends Labels> extends BaseSummary<T> {
    observe(labels: RequiredLabels<T>, value: number): void;
}

interface SummaryWithOptionalLabels extends SummaryWithRequiredLabels<Labels> {
    observe(value: number): void;
    observe(labels: Labels, value: number): void;
}

export type Summary<T extends Labels = Labels> =
    HasRequiredKeys<T> extends true ? SummaryWithRequiredLabels<T> : SummaryWithOptionalLabels;

export class SummaryImpl<T extends Labels = Labels>
    extends InstrumentImpl<SummaryValue>
    implements SummaryWithOptionalLabels
{
    public readonly summaryOptions: SummaryOptionsParsed;

    constructor(name: string, description: string, registry: RegistryImpl, options?: SummaryOptions) {
        super(name, description, registry, options);
        this.summaryOptions = parseSummaryOptions(this.options);
    }

    public observe(value: number): void;
    public observe(labels: RequiredLabels<T>, value: number): void;
    public observe(labelsOrValue?: number | RequiredLabels<T>, maybeValue?: number): void {
        const [labels = {}, value] = getLabelsAndRequiredValue(labelsOrValue, maybeValue);

        this.updateValue(labels, (values) => {
            if (typeof values === "undefined") {
                values = {
                    digest: createDigestAlgorithm(this.summaryOptions),
                    sum: 0,
                    count: 0,
                };
            }

            values.digest.observe(value);
            values.sum += value;
            values.count++;

            if (this.summaryOptions.tdigestOptions.mode === "approximate") {
                if (values.count % this.summaryOptions.tdigestOptions.compressEvery === 0) {
                    values.digest.compress();
                }
            }

            return values;
        });
    }

    public getDebugValue(labels: RequiredLabels<T>): Readonly<SummaryDebugValue> | undefined {
        const values = super.getValue(labels);
        if (typeof values === "undefined") {
            return undefined;
        }

        const percentiles = new Map<number, number>();
        for (let i = 0; i < this.summaryOptions.percentiles.length; i++) {
            percentiles.set(
                this.summaryOptions.percentiles[i],
                values.digest.percentile(this.summaryOptions.percentiles[i]),
            );
        }

        return {
            percentiles,
            sum: values.sum,
            count: values.count,
        };
    }
}
