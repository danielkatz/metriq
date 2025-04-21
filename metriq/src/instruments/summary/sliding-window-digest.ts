import { DigestAlgorithm } from "./digest";
import { SlidingWindowOptionsParsed, TDigestOptionsParsed } from "./options";
import { CumulativeDigest } from "./cumulative-digest";

/**
 * Provides a sliding-window quantile estimator using TDigest.
 *
 * This class divides a fixed time window into multiple steps (buckets), each backed by a TDigest.
 * The design helps maintain an up-to-date view of the distribution of observed values by aging out
 * older data in a controlled manner. New observations are added to every bucket until their respective
 * time slice expires, at which point the bucket is reset with a fresh TDigest. This approach ensures that,
 * while each bucket cumulatively aggregates data, older data is gradually removed, enabling a reliable
 * estimation of quantiles over a recent period.
 */
export class SlidingWindowDigest implements DigestAlgorithm {
    private readonly windowSteps: number;
    private readonly ringBuffer: CumulativeDigest[];
    private readonly stepRotationIntervalMs: number;
    private currentStep: number = 0;
    private currentStepTimestampMs: number = 0;

    constructor(
        private readonly slidingWindowOptions: SlidingWindowOptionsParsed,
        private readonly tdigestOptions: TDigestOptionsParsed,
    ) {
        if (this.slidingWindowOptions.windowDurationSeconds <= 0) {
            throw new Error("windowDurationSeconds must be greater than 0");
        }

        if (this.slidingWindowOptions.windowSteps <= 0 || !Number.isInteger(this.slidingWindowOptions.windowSteps)) {
            throw new Error("windowSteps must be a positive integer");
        }

        this.windowSteps = this.slidingWindowOptions.windowSteps;

        this.stepRotationIntervalMs =
            (this.slidingWindowOptions.windowDurationSeconds * 1000) / Math.ceil(this.windowSteps);

        this.ringBuffer = new Array<CumulativeDigest>(this.windowSteps);
        this.reset();
    }

    observe(value: number): void {
        this.rotateStepIfExpired();
        for (let i = 0; i < this.windowSteps; i++) {
            this.ringBuffer[i].observe(value);
        }
    }

    compress(): void {
        for (let i = 0; i < this.windowSteps; i++) {
            this.ringBuffer[i].compress();
        }
    }

    reset(): void {
        for (let i = 0; i < this.windowSteps; i++) {
            this.ringBuffer[i].reset();
        }

        this.currentStep = 0;
        this.currentStepTimestampMs = Date.now();
    }

    percentile(quantile: number): number {
        this.rotateStepIfExpired();
        return this.ringBuffer[this.currentStep].percentile(quantile);
    }

    rotateStepIfExpired(): void {
        // If the step rotation interval is infinite, we don't need to rotate steps
        if (this.stepRotationIntervalMs === Infinity) {
            return;
        }

        // Calculate the number of steps to rotate
        const timeSinceLastStepMs = Date.now() - this.currentStepTimestampMs;
        const rotateStepsCount = Math.min(
            this.windowSteps,
            Math.floor(timeSinceLastStepMs / this.stepRotationIntervalMs),
        );
        this.currentStepTimestampMs += rotateStepsCount * this.stepRotationIntervalMs;

        // If the time since the last step is greater than the step rotation interval,
        // we need to rotate the digests
        for (let i = 0; i < rotateStepsCount; i++) {
            // Create a new TDigest for the current step
            this.ringBuffer[this.currentStep] = new CumulativeDigest(this.tdigestOptions);

            // Increment the current step
            this.currentStep++;

            // Wrap around if we've reached the end of the ring buffer
            if (this.currentStep >= this.windowSteps) {
                this.currentStep = 0;
            }
        }
    }
}
