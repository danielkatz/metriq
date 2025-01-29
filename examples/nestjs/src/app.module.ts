import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MetriqModule, MetricsController } from "@metriq/nestjs";

@Module({
    imports: [MetriqModule.forRoot({ metricsPath: "/metrics" })],
    controllers: [AppController, MetricsController],
    providers: [AppService],
})
export class AppModule {}
