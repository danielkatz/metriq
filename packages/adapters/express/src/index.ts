import { pipeline } from "node:stream/promises";
import { Request, Response, NextFunction } from "express";
import { Metrics, prometheusExporter } from "metriq";

export const prometheus = (metrics: Metrics) => {
    const exporter = prometheusExporter(metrics);

    return (req: Request, res: Response, next: NextFunction): void => {
        res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
        pipeline(exporter.stream(), res).catch(next);
    };
};
