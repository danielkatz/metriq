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
