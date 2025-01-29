import { Controller, Get, StreamableFile } from "@nestjs/common";
import { MetricsService } from "./service";

@Controller("/metrics")
export class MetricsController {
    constructor(private readonly service: MetricsService) {}

    @Get()
    index(): StreamableFile {
        return this.service.getMetrics();
    }
}
