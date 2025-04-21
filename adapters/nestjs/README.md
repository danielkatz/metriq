# @metriq/nestjs

[![npm version](https://img.shields.io/npm/v/@metriq/nestjs.svg)](https://www.npmjs.com/package/@metriq/nestjs)
[![License](https://img.shields.io/npm/l/@metriq/nestjs.svg)](https://www.npmjs.com/package/@metriq/nestjs)

NestJS adapter for Metriq metrics library.

## 📦 Installation

```bash
npm install @metriq/nestjs
```

## 🚀 Quick Start

```typescript
// app.service.ts
import { Injectable } from "@nestjs/common";
import { Counter, Metrics } from "metriq";
import { InjectMetriq } from "@metriq/nestjs";

@Injectable()
export class AppService {
    private readonly counter: Counter;

    constructor(
        // Inject the Metriq service
        @InjectMetriq() readonly metrics: Metrics,
    ) {
        // Create a counter
        this.counter = metrics.createCounter("http_requests_total", "Total HTTP requests");
    }

    // ...
    // Use the counter via this.counter
}

// app.module.ts
import { Module } from "@nestjs/common";
import { MetriqModule, MetricsController } from "@metriq/nestjs";
import { AppService } from "./app.service";

@Module({
    imports: [
        // Initialize the Metriq module
        MetriqModule.forRoot(),
    ],
    controllers: [
        // Add the metrics endpoint controller, it defaults to /metrics
        MetricsController,
    ],
    providers: [AppService],
})
export class AppModule {}

// main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
}

void bootstrap();
```

## 🔧 Request Monitoring Example

```typescript
// app.interceptor.ts
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

// app.module.ts
import { Module } from "@nestjs/common";
import { MetriqModule, MetricsController } from "@metriq/nestjs";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppInterceptor } from "./app.interceptor";

@Module({
    imports: [
        // Initialize the Metriq module
        MetriqModule.forRoot(),
    ],
    controllers: [
        // Add the metrics endpoint controller, it defaults to /metrics
        MetricsController,
    ],
    providers: [
        {
            // Add the interceptor to the app
            provide: APP_INTERCEPTOR,
            useClass: AppInterceptor,
        },
    ],
})
export class AppModule {}
```
