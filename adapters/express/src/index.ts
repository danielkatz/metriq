import { Metrics, prometheusExporter } from "metriq";
import { RequestHandler } from "express";
import { ExpressPrometheusAdapter } from "./express-adapter";

export const prometheus = (metrics: Metrics): RequestHandler => {
    const exporter = prometheusExporter(metrics);
    const adapter = metrics.createAdapter(
        (metrics, builtinMetrics) => new ExpressPrometheusAdapter(metrics, builtinMetrics, exporter),
    );
    return adapter.middleware;
};
