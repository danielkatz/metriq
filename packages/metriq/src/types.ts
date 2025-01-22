type ExcludeRecord<T> = {
    [K in keyof T as string extends K ? never : K]: T[K];
};

type RequiredKeys<T extends object> = {
    [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

export type Labels = Record<string, string | undefined>;

export type RequiredLabels<T extends Labels> = T & Labels;

export type HasRequiredKeys<T extends object> = RequiredKeys<ExcludeRecord<T>> extends never ? false : true;