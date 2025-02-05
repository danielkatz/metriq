import Fastify from "fastify";
import { metriq } from "metriq";
import { prometheus } from "@metriq/fastify";

// Extend FastifyRequest to store the start time
declare module "fastify" {
    interface FastifyRequest {
        requestTime?: [number, number];
    }
}

const app = Fastify();
const metrics = metriq();

// Create metrics
const requests = metrics.createCounter<{
    method: string;
    path: string;
    status: string;
}>("http_requests_total", "Total HTTP requests");

const latency = metrics.createHistogram<{
    method: string;
    path: string;
}>("http_request_duration_seconds", "Request duration in seconds", {
    buckets: [0.1, 0.5, 1, 2, 5],
});

// Hooks to track requests
app.addHook("onRequest", (request, reply, done) => {
    const start = process.hrtime();
    request.requestTime = start;
    done();
});

app.addHook("onResponse", (request, reply, done) => {
    const [seconds, nanoseconds] = process.hrtime(request.requestTime);
    const duration = seconds + nanoseconds / 1e9;
    const labels = {
        method: request.method,
        path: request.routeOptions.url ?? "unknown",
        status: reply.statusCode.toString(),
    };
    requests.increment(labels);
    latency.observe(
        {
            method: labels.method,
            path: labels.path,
        },
        duration,
    );
    done();
});

// Metrics endpoint
app.get("/metrics", prometheus(metrics));

await app.listen({ port: 3000 });
