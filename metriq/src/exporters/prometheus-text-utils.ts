const QUOTE = 34; // '"'  -> 0x22
const BACKSL = 92; // '\'  -> 0x5c
const NEWLINE = 10; // '\n' -> 0x0a

export function encodeStringValue(str: string | undefined): string {
    if (typeof str !== "string") {
        if (typeof str === "undefined") {
            return "";
        }

        throw new Error("Value is not a string");
    }

    let out = "";
    let start = 0;

    for (let i = 0; i < str.length; ++i) {
        const code = str.charCodeAt(i);
        if (code === QUOTE || code === BACKSL || code === NEWLINE) {
            if (start < i) {
                out += str.slice(start, i); // flush safe run
            }

            out += code === NEWLINE ? "\\n" : "\\" + str[i];
            start = i + 1;
        }
    }

    if (start < str.length) {
        out += str.slice(start); // flush any tail
    }

    return out;
}

export function encodeNumericValue(value: number): string {
    if (typeof value !== "number") {
        throw new Error("Value is not a number");
    }

    if (Number.isNaN(value)) {
        return "NaN";
    }

    if (value === Infinity) {
        return "+Inf";
    }

    if (value === -Infinity) {
        return "-Inf";
    }

    return value.toString();
}
