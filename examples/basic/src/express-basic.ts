import express from "express";
import { metriq } from "metriq";
import { prometheus } from "@metriq/express";

// Initialize metrics
const metrics = metriq();

// Create a counter
metrics.createCounter("http_requests_total", "Total HTTP requests");

// Create Express app
const app = express();

// Add metrics endpoint
app.get("/metrics", prometheus(metrics));

app.listen(3000);
