import { Readable } from "node:stream";
import { Labels } from "./types";

export async function consumeAsyncStringGenerator(stream: AsyncGenerator<string>): Promise<string> {
    let data = "";

    for await (const chunk of stream) {
        data += chunk;
    }

    return data;
}

export function consumeStringStream(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = "";

        stream.on("data", (chunk) => {
            data += chunk;
        });

        stream.on("end", () => {
            resolve(data);
        });

        stream.on("error", (error) => {
            reject(error);
        });
    });
}

export function generateKey(labels: Labels): string {
    const keys = Object.keys(labels);

    if (keys.length === 0) {
        return "";
    }

    const sortedKeys = keys.sort();
    const finalLabels = Object.fromEntries(sortedKeys.map((key) => [key, labels[key]]));

    return JSON.stringify(finalLabels);
}

export function* batchGenerator<T>(
    generator: Generator<T>,
    batchSize: number,
    formatter: (item: T) => string,
): Generator<string> {
    let batch = "";

    for (const item of generator) {
        batch += formatter(item);

        if (batch.length >= batchSize) {
            yield batch;
            batch = "";
        }
    }

    if (batch.length > 0) {
        yield batch;
    }
}
