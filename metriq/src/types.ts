type ExcludeRecord<T> = {
    [K in keyof T as string extends K ? never : K]: T[K];
};

type RequiredKeys<T extends object> = {
    [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

export type Labels = Record<string, string | undefined>;

export type RequiredLabels<T extends Labels> = T & Labels;

export type HasRequiredKeys<T extends object> = RequiredKeys<ExcludeRecord<T>> extends never ? false : true;

/**
 * DeepPartial is a type that makes all properties of an object optional.
 * Useful while parsing options from user input to ensure all cases are handled.
 */
export type DeepPartial<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [P in keyof T]?: T[P] extends Array<any> ? T[P] : T[P] extends object ? DeepPartial<T[P]> : T[P];
};
