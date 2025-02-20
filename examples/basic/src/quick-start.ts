import express from "express";
import { metriq } from "metriq";
import { prometheus } from "@metriq/express";

// Initialize metrics
const metrics = metriq({
    // Automatically remove timeseries not updated in 1 hour
    defaultTtl: 3600000,
});

// Create a counter with typed labels
type RequestLabels = {
    method: string;
    path: string;
};

const requests = metrics.createCounter<RequestLabels>("http_requests_total", "Total HTTP requests");

// Dynamic labels - no pre-registration needed
requests.increment({
    method: "GET",
    path: "/api/users",
    status: "200", // Additional label on the fly
});

// Create Express app and expose metrics
const app = express();
app.get("/metrics", prometheus(metrics));
app.listen(3000);

// Access metric values (great for testing)
console.log(requests.getDebugValue({ method: "GET", path: "/api/users" }));
