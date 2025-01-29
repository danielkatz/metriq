/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, tap } from "rxjs";
import { Counter, Histogram, Metrics } from "metriq";
import { InjectMetriq } from "@metriq/nestjs";

type RequestLabels = { method: string; path: string; status: string };
type RequestLatencyLabels = { method: string; path: string };

@Injectable()
export class AppInterceptor implements NestInterceptor {
    private readonly requests: Counter<RequestLabels>;
    private readonly latency: Histogram<RequestLatencyLabels>;

    constructor(@InjectMetriq() metrics: Metrics) {
        // Create metrics
        this.requests = metrics.createCounter<RequestLabels>("http_requests_total", "Total HTTP requests");

        this.latency = metrics.createHistogram<RequestLatencyLabels>(
            "http_request_duration_seconds",
            "Request duration in seconds",
            {
                buckets: [0.1, 0.5, 1, 2, 5],
            },
        );
    }

    // Interceptor to track requests and latency
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const http = context.switchToHttp();
        const req = http.getRequest<Request>();
        const res = http.getResponse<Response>();
        const start = process.hrtime();

        return next.handle().pipe(
            tap(() => {
                const [seconds, nanoseconds] = process.hrtime(start);
                const duration = seconds + nanoseconds / 1e9;

                const labels = {
                    method: req.method,
                    path: req.route?.path ?? "unknown",
                    status: res.statusCode.toString(),
                };

                this.requests.increment(labels);
                this.latency.observe(
                    {
                        method: labels.method,
                        path: labels.path,
                    },
                    duration,
                );
            }),
        );
    }
}
