import { Metrics, prometheusExporter } from "metriq";
import { RouteHandlerMethod } from "fastify";
import { FastifyPrometheusAdapter } from "./fastify-adapter";

export const prometheus = (metrics: Metrics): RouteHandlerMethod => {
    const exporter = prometheusExporter(metrics);
    const adapter = metrics.createAdapter(
        (metrics, builtinMetrics) => new FastifyPrometheusAdapter(metrics, builtinMetrics, exporter),
    );
    return adapter.handler;
};
