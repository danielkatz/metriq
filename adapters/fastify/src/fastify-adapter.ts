import { FastifyRequest, FastifyReply, RouteHandlerMethod } from "fastify";
import { Metrics, scrapeHandler } from "metriq";

export const prometheus = (metrics: Metrics): RouteHandlerMethod => {
    const handler = scrapeHandler(metrics);
    return (req: FastifyRequest, res: FastifyReply) => {
        const { contentType, stream } = handler.scrape(req.headers.accept);
        res.type(contentType);
        res.send(stream);
    };
};
