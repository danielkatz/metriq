import { pipeline } from "node:stream/promises";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { Metrics, scrapeHandler } from "metriq";

export const prometheus = (metrics: Metrics): RequestHandler => {
    const handler = scrapeHandler(metrics);
    return (req: Request, res: Response, next: NextFunction) => {
        const { contentType, stream } = handler.scrape(req.headers.accept);
        res.setHeader("Content-Type", contentType);
        pipeline(stream, res).catch(next);
    };
};
