import { DeepPartial } from "../../types";
import { InstrumentOptions } from "../instrument";

// Default percentiles
export const DEFAULT_PERCENTILES = [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999];

// Default TDigest options (approximate mode)
export const DEFAULT_DELTA = 0.01;
export const DEFAULT_K = 25;
export const DEFAULT_CX = 1.1;
export const DEFAULT_COMPRESS_EVERY = 1000;

// Default sliding window options
export const DEFAULT_WINDOW_DURATION = Infinity;
export const DEFAULT_WINDOW_STEPS = 1;

/**
 * Configuration options for approximate TDigest calculations.
 */
export type ApproximateTDigestOptions = {
    /**
     * Compression factor (0-1). Controls accuracy vs memory tradeoff.
     * Higher values (closer to 1.0) mean more compression/less memory but lower accuracy.
     * Lower values mean less compression/more memory but higher accuracy.
     * Default is 0.01.
     */
    delta?: number;

    /**
     * Size threshold that triggers recompression as the TDigest grows.
     * Set to 0 to disable automatic recompression.
     * Higher values improve performance but may temporarily reduce accuracy.
     * Default is 25.
     */
    K?: number;

    /**
     * Controls how often to update cached cumulative totals.
     * Lower values improve accuracy but reduce performance.
     * Set to 0 to use exact quantiles for each new point.
     * Default is 1.1.
     */
    CX?: number;

    /**
     * Number of observations after which to compress the digest.
     * Higher values improve performance but may temporarily reduce accuracy.
     * Default is 1000.
     */
    compressEvery?: number;
};

export type ApproximateTDigestOptionsParsed = Required<ApproximateTDigestOptions>;

/**
 * Configuration options for the TDigest algorithm used for percentile calculations.
 *
 * Two modes are available:
 * 1. "approximate" - Uses TDigest algorithm to approximate percentiles with configurable accuracy (default)
 * 2. "exact" - Stores all values exactly (high memory usage, perfect accuracy)
 */
export type TDigestOptions =
    | ({
          /** Use approximate calculations with TDigest algorithm (lower memory usage) */
          mode: "approximate";
      } & ApproximateTDigestOptions)
    | {
          /** Use exact calculations (higher memory usage, perfect accuracy) */
          mode?: "exact";
      };

export type TDigestOptionsParsed =
    | ({
          mode: "approximate";
      } & ApproximateTDigestOptionsParsed)
    | {
          mode: "exact";
      };

/**
 * Configuration options for the sliding window behavior.
 */
export type SlidingWindowOptions = {
    /**
     * Duration in seconds for the sliding window.
     * Observations older than this will be removed.
     * Use Infinity to keep all observations indefinitely.
     * Default is Infinity.
     */
    windowDurationSeconds?: number;

    /**
     * Number of steps/buckets to divide the window into.
     * More steps provide smoother transitions as data ages out.
     * Must be a positive integer.
     * Default is 1.
     */
    windowSteps?: number;
};

export type SlidingWindowOptionsParsed = Required<SlidingWindowOptions>;

/**
 * Configuration for the type of summary metric.
 *
 * Two types are available:
 * 1. "windowed" - Only considers observations within a sliding time window (default)
 * 2. "cumulative" - Tracks all observations for the lifetime of the metric
 */
export type SummaryType =
    | {
          /**
           * Cumulative mode - tracks all observations for the lifetime of the metric.
           */
          type: "cumulative";
      }
    | {
          /**
           * Windowed mode - only considers observations within a sliding time window.
           * Useful for tracking recent trends and automatically aging out old data.
           * This is the default if type is not specified.
           */
          type?: "windowed";

          /** Configuration for the sliding window behavior */
          slidingWindowOptions?: SlidingWindowOptions;
      };

export type SummaryTypeParsed =
    | {
          type: "cumulative";
      }
    | {
          type: "windowed";
          slidingWindowOptions: SlidingWindowOptionsParsed;
      };

/**
 * Complete configuration options for Summary metrics.
 */
export type SummaryOptions = InstrumentOptions & {
    /**
     * Array of percentiles to track (values between 0 and 1).
     * Common values include 0.5 (median), 0.95, 0.99 (high percentiles).
     */
    percentiles?: number[];

    /** Configuration for the TDigest algorithm used for percentile calculations */
    tdigestOptions?: TDigestOptions;
} & SummaryType;

export type SummaryOptionsParsed = InstrumentOptions & {
    percentiles: number[];
    tdigestOptions: TDigestOptionsParsed;
} & SummaryTypeParsed;

export function parseSummaryOptions(options: DeepPartial<SummaryOptions>): SummaryOptionsParsed {
    // Validate and set percentiles
    let percentiles: number[] = DEFAULT_PERCENTILES;

    if (options.percentiles) {
        if (!Array.isArray(options.percentiles)) {
            throw new Error("Percentiles must be an array");
        }

        if (options.percentiles.length === 0) {
            throw new Error("Percentiles must be an array of numbers");
        }

        if (options.percentiles.some((p) => typeof p !== "number" || p < 0 || p > 1)) {
            throw new Error("Percentiles must be an array of numbers between 0 and 1");
        }

        percentiles = [...options.percentiles];
    }

    // Validate and set tdigestOptions
    let tdigestOptions: TDigestOptionsParsed;
    if (options.tdigestOptions) {
        if (options.tdigestOptions.mode === "approximate") {
            // Validate approximate mode options
            const { delta, K, CX, compressEvery } = options.tdigestOptions;

            if (delta !== undefined && (typeof delta !== "number" || delta <= 0 || delta > 1)) {
                throw new Error("TDigest delta must be a number between 0 and 1");
            }

            if (K !== undefined && (typeof K !== "number" || K < 0 || !Number.isInteger(K))) {
                throw new Error("TDigest K must be a non-negative integer");
            }

            if (CX !== undefined && (typeof CX !== "number" || CX <= 0)) {
                throw new Error("TDigest CX must be a positive number");
            }

            if (
                compressEvery !== undefined &&
                (typeof compressEvery !== "number" || compressEvery <= 0 || !Number.isInteger(compressEvery))
            ) {
                throw new Error("TDigest compressEvery must be a positive integer");
            }

            tdigestOptions = {
                mode: "approximate",
                delta: delta ?? DEFAULT_DELTA,
                K: K ?? DEFAULT_K,
                CX: CX ?? DEFAULT_CX,
                compressEvery: compressEvery ?? DEFAULT_COMPRESS_EVERY,
            };
        } else {
            // Exact mode has no additional options
            tdigestOptions = { mode: "exact" };
        }
    } else {
        // Default to approximate mode with default options
        tdigestOptions = {
            mode: "approximate",
            delta: DEFAULT_DELTA,
            K: DEFAULT_K,
            CX: DEFAULT_CX,
            compressEvery: DEFAULT_COMPRESS_EVERY,
        };
    }

    // Validate and set summary type
    let summaryType: SummaryTypeParsed;
    if (options.type === "cumulative") {
        summaryType = { type: "cumulative" };
    } else {
        // Default to windowed type with validated options
        const slidingWindowOptions: SlidingWindowOptionsParsed = {
            windowDurationSeconds: DEFAULT_WINDOW_DURATION,
            windowSteps: DEFAULT_WINDOW_STEPS,
        };

        if (options.type === "windowed" && options.slidingWindowOptions) {
            const { windowDurationSeconds, windowSteps } = options.slidingWindowOptions;

            if (windowDurationSeconds !== undefined) {
                if (typeof windowDurationSeconds !== "number" || windowDurationSeconds <= 0) {
                    throw new Error("Window duration must be a positive number");
                }
                slidingWindowOptions.windowDurationSeconds = windowDurationSeconds;
            }

            if (windowSteps !== undefined) {
                if (typeof windowSteps !== "number" || windowSteps <= 0 || !Number.isInteger(windowSteps)) {
                    throw new Error("Window steps must be a positive integer");
                }
                slidingWindowOptions.windowSteps = windowSteps;
            }
        }

        summaryType = {
            type: "windowed",
            slidingWindowOptions,
        };
    }

    return {
        percentiles,
        tdigestOptions,
        ...summaryType,
    };
}
