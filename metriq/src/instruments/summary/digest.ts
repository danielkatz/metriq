import { CumulativeDigest } from "./cumulative-digest";
import { SummaryOptionsParsed } from "./options";
import { SlidingWindowDigest } from "./sliding-window-digest";

export interface DigestAlgorithm {
    observe(value: number): void;
    compress(): void;
    percentile(quantile: number): number;
    reset(): void;
}

export function createDigestAlgorithm(options: SummaryOptionsParsed): DigestAlgorithm {
    if (options.type === "cumulative") {
        return new CumulativeDigest(options.tdigestOptions);
    }

    if (options.type === "windowed") {
        return new SlidingWindowDigest(options.slidingWindowOptions, options.tdigestOptions);
    }

    throw new Error("Invalid summary type");
}
