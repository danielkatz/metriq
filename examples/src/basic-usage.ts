import { metriq } from "metriq";
import { prometheus } from "@metriq/express";
import express from "express";

const app = express();
const metrics = metriq();

app.get("/metrics", prometheus(metrics));

app.listen(3000);

console.log("Server is running on port 3000, http://localhost:3000/metrics");
