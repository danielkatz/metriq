import { describe, it, expect } from "vitest";
import { batchGenerator } from "./utils";
import { getLabelsAndOptionalValue, getLabelsAndRequiredValue } from "./utils";

describe("batchGenerator", () => {
    it("should batch items correctly based on size", () => {
        function* numberGenerator(): Generator<number> {
            yield 1;
            yield 2;
            yield 3;
            yield 4;
        }

        const formatter = (num: number) => num.toString();
        const batches = [...batchGenerator(numberGenerator(), 2, formatter)];

        expect(batches).toEqual(["12", "34"]);
    });

    it("should handle empty generator", () => {
        // eslint-disable-next-line require-yield
        function* emptyGenerator(): Generator<number> {
            return;
        }

        const formatter = (num: number) => num.toString();
        const batches = [...batchGenerator(emptyGenerator(), 5, formatter)];

        expect(batches).toEqual([]);
    });

    it("should handle remaining items less than batch size", () => {
        function* numberGenerator(): Generator<number> {
            yield 1;
            yield 2;
            yield 3;
        }

        const formatter = (num: number) => num.toString();
        const batches = [...batchGenerator(numberGenerator(), 2, formatter)];

        expect(batches).toEqual(["12", "3"]);
    });

    it("should handle custom formatter", () => {
        function* wordGenerator(): Generator<string> {
            yield "hello";
            yield "world";
        }

        const formatter = (word: string) => `${word}|`;
        const batches = [...batchGenerator(wordGenerator(), 6, formatter)];

        expect(batches).toEqual(["hello|", "world|"]);
    });
});

describe("getLabelsAndOptionalValue", () => {
    it("should handle value only", () => {
        const [labels, value] = getLabelsAndOptionalValue(42);
        expect(labels).toBeUndefined();
        expect(value).toBe(42);
    });

    it("should handle labels only", () => {
        const [labels, value] = getLabelsAndOptionalValue({ method: "GET" });
        expect(labels).toEqual({ method: "GET" });
        expect(value).toBeUndefined();
    });

    it("should handle both labels and value", () => {
        const [labels, value] = getLabelsAndOptionalValue({ method: "GET" }, 42);
        expect(labels).toEqual({ method: "GET" });
        expect(value).toBe(42);
    });

    it("should handle undefined inputs", () => {
        const [labels, value] = getLabelsAndOptionalValue();
        expect(labels).toBeUndefined();
        expect(value).toBeUndefined();
    });
});

describe("getLabelsAndRequiredValue", () => {
    it("should handle value only", () => {
        const [labels, value] = getLabelsAndRequiredValue(42);
        expect(labels).toBeUndefined();
        expect(value).toBe(42);
    });

    it("should handle labels and value", () => {
        const [labels, value] = getLabelsAndRequiredValue({ method: "GET" }, 42);
        expect(labels).toEqual({ method: "GET" });
        expect(value).toBe(42);
    });

    it("should handle empty labels with value", () => {
        const [labels, value] = getLabelsAndRequiredValue({}, 42);
        expect(labels).toEqual({});
        expect(value).toBe(42);
    });

    it("should throw when value is missing", () => {
        expect(() => getLabelsAndRequiredValue({ method: "GET" })).toThrow();
    });
});
