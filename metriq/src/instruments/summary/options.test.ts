/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect } from "vitest";
import { parseSummaryOptions, SummaryOptions } from "./options";
import {
    DEFAULT_PERCENTILES,
    DEFAULT_DELTA,
    DEFAULT_K,
    DEFAULT_CX,
    DEFAULT_COMPRESS_EVERY,
    DEFAULT_WINDOW_DURATION,
    DEFAULT_WINDOW_STEPS,
    TDigestOptions,
} from "./options";

describe("parseSummaryOptions", () => {
    it("should use default values when no options are provided", () => {
        // Act
        const options = parseSummaryOptions({});

        // Assert
        expect(options.percentiles).toEqual(DEFAULT_PERCENTILES);
        expect(options.tdigestOptions).toEqual({
            mode: "approximate",
            delta: DEFAULT_DELTA,
            K: DEFAULT_K,
            CX: DEFAULT_CX,
            compressEvery: DEFAULT_COMPRESS_EVERY,
        });
        expect(options.type).toBe("windowed");
        if (options.type === "windowed") {
            expect(options.slidingWindowOptions).toEqual({
                windowDurationSeconds: DEFAULT_WINDOW_DURATION,
                windowSteps: DEFAULT_WINDOW_STEPS,
            });
        }
    });

    describe("percentiles", () => {
        it("should use custom percentiles when provided", () => {
            // Arrange
            const customPercentiles = [0.1, 0.5, 0.9];

            // Act
            const options = parseSummaryOptions({ percentiles: customPercentiles });

            // Assert
            expect(options.percentiles).toEqual(customPercentiles);
        });

        it("should throw error when percentiles is not an array", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({ percentiles: "invalid" as any });
            }).toThrow("Percentiles must be an array");
        });

        it("should throw error when percentiles is an empty array", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({ percentiles: [] });
            }).toThrow("Percentiles must be an array of numbers");
        });

        it("should throw error when percentiles contains invalid values", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({ percentiles: [0.5, 1.5] });
            }).toThrow("Percentiles must be an array of numbers between 0 and 1");

            expect(() => {
                parseSummaryOptions({ percentiles: [0.5, -0.1] });
            }).toThrow("Percentiles must be an array of numbers between 0 and 1");

            expect(() => {
                parseSummaryOptions({ percentiles: [0.5, "invalid" as any] });
            }).toThrow("Percentiles must be an array of numbers between 0 and 1");
        });
    });

    describe("tdigestOptions", () => {
        it("should use default approximate mode when not specified", () => {
            // Act
            const options = parseSummaryOptions({});

            // Assert
            expect(options.tdigestOptions).toEqual({
                mode: "approximate",
                delta: DEFAULT_DELTA,
                K: DEFAULT_K,
                CX: DEFAULT_CX,
                compressEvery: DEFAULT_COMPRESS_EVERY,
            });
        });

        it("should use exact mode when specified", () => {
            // Act
            const options = parseSummaryOptions({ tdigestOptions: { mode: "exact" } });

            // Assert
            expect(options.tdigestOptions).toEqual({ mode: "exact" });
        });

        it("should use custom approximate mode options when provided", () => {
            // Arrange
            const customOptions: TDigestOptions = {
                mode: "approximate",
                delta: 0.05,
                K: 50,
                CX: 1.5,
                compressEvery: 2000,
            };

            // Act
            const options = parseSummaryOptions({ tdigestOptions: customOptions });

            // Assert
            expect(options.tdigestOptions).toEqual(customOptions);
        });

        it("should use default values for unspecified approximate mode options", () => {
            // Act
            const options = parseSummaryOptions({
                tdigestOptions: { mode: "approximate", delta: 0.05 },
            });

            // Assert
            expect(options.tdigestOptions).toEqual({
                mode: "approximate",
                delta: 0.05,
                K: DEFAULT_K,
                CX: DEFAULT_CX,
                compressEvery: DEFAULT_COMPRESS_EVERY,
            });
        });

        it("should throw error when delta is invalid", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", delta: 0 } });
            }).toThrow("TDigest delta must be a number between 0 and 1");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", delta: 1.5 } });
            }).toThrow("TDigest delta must be a number between 0 and 1");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", delta: -0.1 } });
            }).toThrow("TDigest delta must be a number between 0 and 1");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", delta: "invalid" as any } });
            }).toThrow("TDigest delta must be a number between 0 and 1");
        });

        it("should throw error when K is invalid", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", K: -1 } });
            }).toThrow("TDigest K must be a non-negative integer");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", K: 1.5 } });
            }).toThrow("TDigest K must be a non-negative integer");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", K: "invalid" as any } });
            }).toThrow("TDigest K must be a non-negative integer");
        });

        it("should throw error when CX is invalid", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", CX: 0 } });
            }).toThrow("TDigest CX must be a positive number");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", CX: -1 } });
            }).toThrow("TDigest CX must be a positive number");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", CX: "invalid" as any } });
            }).toThrow("TDigest CX must be a positive number");
        });

        it("should throw error when compressEvery is invalid", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", compressEvery: 0 } });
            }).toThrow("TDigest compressEvery must be a positive integer");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", compressEvery: -1 } });
            }).toThrow("TDigest compressEvery must be a positive integer");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", compressEvery: 1.5 } });
            }).toThrow("TDigest compressEvery must be a positive integer");

            expect(() => {
                parseSummaryOptions({ tdigestOptions: { mode: "approximate", compressEvery: "invalid" as any } });
            }).toThrow("TDigest compressEvery must be a positive integer");
        });
    });

    describe("summary type", () => {
        it("should use windowed type by default", () => {
            // Act
            const options = parseSummaryOptions({});

            // Assert
            expect(options.type).toBe("windowed");
            if (options.type === "windowed") {
                expect(options.slidingWindowOptions).toEqual({
                    windowDurationSeconds: DEFAULT_WINDOW_DURATION,
                    windowSteps: DEFAULT_WINDOW_STEPS,
                });
            }
        });

        it("should use cumulative type when specified", () => {
            // Act
            const options = parseSummaryOptions({ type: "cumulative" });

            // Assert
            expect(options.type).toBe("cumulative");
            expect(options).not.toHaveProperty("slidingWindowOptions");
        });

        it("should use custom sliding window options when provided", () => {
            // Arrange
            const customOptions = {
                windowDurationSeconds: 60,
                windowSteps: 5,
            };

            // Act
            const options = parseSummaryOptions({
                type: "windowed",
                slidingWindowOptions: customOptions,
            });

            // Assert
            expect(options.type).toBe("windowed");
            if (options.type === "windowed") {
                expect(options.slidingWindowOptions).toEqual(customOptions);
            }
        });

        it("should use default values for unspecified sliding window options", () => {
            // Act
            const options = parseSummaryOptions({
                type: "windowed",
                slidingWindowOptions: { windowDurationSeconds: 60 },
            });

            // Assert
            expect(options.type).toBe("windowed");
            if (options.type === "windowed") {
                expect(options.slidingWindowOptions).toEqual({
                    windowDurationSeconds: 60,
                    windowSteps: DEFAULT_WINDOW_STEPS,
                });
            }
        });

        it("should throw error when windowDurationSeconds is invalid", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({
                    type: "windowed",
                    slidingWindowOptions: { windowDurationSeconds: 0 },
                });
            }).toThrow("Window duration must be a positive number");

            expect(() => {
                parseSummaryOptions({
                    type: "windowed",
                    slidingWindowOptions: { windowDurationSeconds: -1 },
                });
            }).toThrow("Window duration must be a positive number");

            expect(() => {
                parseSummaryOptions({
                    type: "windowed",
                    slidingWindowOptions: { windowDurationSeconds: "invalid" as any },
                });
            }).toThrow("Window duration must be a positive number");
        });

        it("should throw error when windowSteps is invalid", () => {
            // Act & Assert
            expect(() => {
                parseSummaryOptions({
                    type: "windowed",
                    slidingWindowOptions: { windowSteps: 0 },
                });
            }).toThrow("Window steps must be a positive integer");

            expect(() => {
                parseSummaryOptions({
                    type: "windowed",
                    slidingWindowOptions: { windowSteps: -1 },
                });
            }).toThrow("Window steps must be a positive integer");

            expect(() => {
                parseSummaryOptions({
                    type: "windowed",
                    slidingWindowOptions: { windowSteps: 1.5 },
                });
            }).toThrow("Window steps must be a positive integer");

            expect(() => {
                parseSummaryOptions({
                    type: "windowed",
                    slidingWindowOptions: { windowSteps: "invalid" as any },
                });
            }).toThrow("Window steps must be a positive integer");
        });
    });

    describe("type checking", () => {
        it("valid configurations", () => {
            // Empty options
            parseSummaryOptions({});

            // Valid percentiles
            parseSummaryOptions({ percentiles: [0.1, 0.5, 0.9] });

            // Valid tdigest options - exact mode
            parseSummaryOptions({ tdigestOptions: { mode: "exact" } });

            // Valid tdigest options - approximate mode with all options
            parseSummaryOptions({
                tdigestOptions: {
                    mode: "approximate",
                    delta: 0.05,
                    K: 50,
                    CX: 1.5,
                    compressEvery: 2000,
                },
            });

            // Valid tdigest options - approximate mode with partial options
            parseSummaryOptions({
                tdigestOptions: {
                    mode: "approximate",
                    delta: 0.05,
                },
            });

            // Valid cumulative type
            parseSummaryOptions({ type: "cumulative" });

            // Valid windowed type with no options
            parseSummaryOptions({ type: "windowed" });

            // Valid windowed type with all options
            parseSummaryOptions({
                type: "windowed",
                slidingWindowOptions: {
                    windowDurationSeconds: 60,
                    windowSteps: 5,
                },
            });

            // Valid windowed type with partial options
            parseSummaryOptions({
                type: "windowed",
                slidingWindowOptions: {
                    windowDurationSeconds: 60,
                },
            });

            // Valid combination of all options
            parseSummaryOptions({
                percentiles: [0.1, 0.5, 0.9],
                tdigestOptions: {
                    mode: "approximate",
                    delta: 0.05,
                    K: 50,
                    CX: 1.5,
                    compressEvery: 2000,
                },
                type: "windowed",
                slidingWindowOptions: {
                    windowDurationSeconds: 60,
                    windowSteps: 5,
                },
            });
        });

        it("type checking", () => {
            // @ts-expect-error wrong types
            const _invalidPercentiles: SummaryOptions = { percentiles: "invalid" };

            // @ts-expect-error wrong types
            const _invalidPercentileValues: SummaryOptions = { percentiles: ["0.5"] };

            // @ts-expect-error wrong types
            const _invalidTDigestMode: SummaryOptions = { tdigestOptions: { mode: "invalid" } };

            const _invalidDelta: SummaryOptions = {
                // @ts-expect-error wrong types
                tdigestOptions: { mode: "approximate", delta: "0.5" },
            };

            const _invalidK: SummaryOptions = {
                // @ts-expect-error wrong types
                tdigestOptions: { mode: "approximate", K: "25" },
            };

            const _invalidCX: SummaryOptions = {
                // @ts-expect-error wrong types
                tdigestOptions: { mode: "approximate", CX: "1.1" },
            };

            const _invalidCompressEvery: SummaryOptions = {
                // @ts-expect-error wrong types
                tdigestOptions: { mode: "approximate", compressEvery: "1000" },
            };

            // @ts-expect-error wrong types
            const _exactModeWithDelta: SummaryOptions = { tdigestOptions: { mode: "exact", delta: 0.05 } };

            // @ts-expect-error wrong types
            const _invalidSummaryType: SummaryOptions = { type: "invalid" };

            const _invalidWindowDurationSeconds: SummaryOptions = {
                type: "windowed",
                // @ts-expect-error wrong types
                slidingWindowOptions: { windowDurationSeconds: "60" },
            };

            const _invalidWindowSteps: SummaryOptions = {
                type: "windowed",
                // @ts-expect-error wrong types
                slidingWindowOptions: { windowSteps: "5" },
            };

            const _cumulativeWithSlidingWindow: SummaryOptions = {
                type: "cumulative",
                // @ts-expect-error wrong types
                slidingWindowOptions: {
                    windowDurationSeconds: 60,
                    windowSteps: 5,
                },
            };

            // @ts-expect-error wrong types
            const _unknownProperty: SummaryOptions = { unknownProperty: "value" };
        });
    });
});
