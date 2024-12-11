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
