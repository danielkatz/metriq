import { Controller, Get, Headers, StreamableFile } from "@nestjs/common";
import { MetricsService } from "./service";

@Controller("/metrics")
export class MetricsController {
    constructor(private readonly service: MetricsService) {}

    @Get()
    index(@Headers("accept") accept?: string): StreamableFile {
        return this.service.getMetrics(accept);
    }
}
