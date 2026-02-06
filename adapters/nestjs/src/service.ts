import { Injectable, StreamableFile } from "@nestjs/common";
import { Metrics, ScrapeHandler, scrapeHandler } from "metriq";
import { InjectMetriq } from "./decorators";

@Injectable()
export class MetricsService {
    private readonly handler: ScrapeHandler;

    constructor(@InjectMetriq() private readonly metrics: Metrics) {
        this.handler = scrapeHandler(this.metrics);
    }

    getMetrics(acceptHeader?: string): StreamableFile {
        const { contentType, stream } = this.handler.scrape(acceptHeader);
        return new StreamableFile(stream, { type: contentType });
    }
}
