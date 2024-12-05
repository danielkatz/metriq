import { describe, it, expect } from "vitest";
import { greet, add } from "./index";

describe("greet", () => {
    it("should return greeting with name", () => {
        expect(greet("World")).toBe("Hello, World!");
    });
});

describe("add", () => {
    it("should add two numbers correctly", () => {
        expect(add(2, 3)).toBe(5);
    });
});
