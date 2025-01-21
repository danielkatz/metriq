import { describe, it, expect } from 'vitest';
import { batchGenerator } from './utils';

describe('batchGenerator', () => {
    it('should batch items correctly based on size', () => {
        function* numberGenerator(): Generator<number> {
            yield 1;
            yield 2;
            yield 3;
            yield 4;
        }

        const formatter = (num: number) => num.toString();
        const batches = [...batchGenerator(numberGenerator(), 2, formatter)];

        expect(batches).toEqual(['12', '34']);
    });

    it('should handle empty generator', () => {
        // eslint-disable-next-line require-yield
        function* emptyGenerator(): Generator<number> {
            return;
        }

        const formatter = (num: number) => num.toString();
        const batches = [...batchGenerator(emptyGenerator(), 5, formatter)];

        expect(batches).toEqual([]);
    });

    it('should handle remaining items less than batch size', () => {
        function* numberGenerator(): Generator<number> {
            yield 1;
            yield 2;
            yield 3;
        }

        const formatter = (num: number) => num.toString();
        const batches = [...batchGenerator(numberGenerator(), 2, formatter)];

        expect(batches).toEqual(['12', '3']);
    });

    it('should handle custom formatter', () => {
        function* wordGenerator(): Generator<string> {
            yield 'hello';
            yield 'world';
        }

        const formatter = (word: string) => `${word}|`;
        const batches = [...batchGenerator(wordGenerator(), 6, formatter)];

        expect(batches).toEqual(['hello|', 'world|']);
    });
}); 