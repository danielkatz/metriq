import Fastify from "fastify";
import { metriq } from "metriq";
import { prometheus } from "@metriq/fastify";

// Initialize metrics
const metrics = metriq();

// Create a counter
metrics.createCounter("http_requests_total", "Total HTTP requests");

// Create Fastify app
const app = Fastify();

// Add metrics endpoint
app.get("/metrics", prometheus(metrics));

await app.listen({ port: 3000 });
