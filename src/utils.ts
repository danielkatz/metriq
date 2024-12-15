import { Readable } from "node:stream";

export function readStreamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = "";

        // Ensure the stream provides strings rather than Buffers.
        stream.setEncoding("utf8");

        // Accumulate chunks into the data string.
        stream.on("data", (chunk: string) => {
            data += chunk;
        });

        // When the stream ends, resolve with the full string.
        stream.on("end", () => {
            resolve(data);
        });

        // If there's an error, reject the promise.
        stream.on("error", (err: Error) => {
            reject(err);
        });
    });
}

export function parseKey(key: string): Labels {
    if (key === "") {
        return {};
    }

    const labels = JSON.parse(key) as Labels;
    return labels;
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
