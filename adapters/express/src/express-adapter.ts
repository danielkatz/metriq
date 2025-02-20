import { Request, Response, NextFunction, RequestHandler } from "express";
import { Metrics, prometheusExporter } from "metriq";

export const prometheus = (metrics: Metrics): RequestHandler => {
    const exporter = prometheusExporter(metrics);
    return (req: Request, res: Response, next: NextFunction) => {
        res.setHeader("Content-Type", exporter.contentType);

        exporter
            .writeToStream(res)
            .then(() => {
                res.end();
            })
            .catch(next);
    };
};
