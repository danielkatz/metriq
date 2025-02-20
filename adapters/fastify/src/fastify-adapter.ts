import { FastifyRequest, FastifyReply, RouteHandlerMethod } from "fastify";
import { Metrics, prometheusExporter } from "metriq";

export const prometheus = (metrics: Metrics): RouteHandlerMethod => {
    const exporter = prometheusExporter(metrics);
    return (req: FastifyRequest, res: FastifyReply) => {
        res.type(exporter.contentType);

        const stream = exporter.generateStream();
        res.send(stream);
    };
};
