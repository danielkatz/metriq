import { TDigest } from "tdigest";
import { DigestAlgorithm } from "./digest";
import { TDigestOptionsParsed } from "./options";

export class CumulativeDigest implements DigestAlgorithm {
    private readonly tdigestOptions: TDigestOptionsParsed;
    private tdigest: TDigest;

    constructor(tdigestOptions: TDigestOptionsParsed) {
        this.tdigestOptions = tdigestOptions;
        this.tdigest = this.createTDigest(tdigestOptions);
    }

    private createTDigest(tdigestOptions: TDigestOptionsParsed): TDigest {
        if (tdigestOptions.mode === "approximate") {
            return new TDigest(tdigestOptions.delta, tdigestOptions.K, tdigestOptions.CX);
        } else if (tdigestOptions.mode === "exact") {
            return new TDigest(false);
        }

        throw new Error("Invalid tdigest mode");
    }

    public compress(): void {
        this.tdigest.compress();
    }

    public observe(value: number): void {
        this.tdigest.push(value);
    }

    public percentile(quantile: number): number {
        return this.tdigest.percentile(quantile);
    }

    public reset(): void {
        this.tdigest = this.createTDigest(this.tdigestOptions);
    }
}
