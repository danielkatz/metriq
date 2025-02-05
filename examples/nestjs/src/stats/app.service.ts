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
