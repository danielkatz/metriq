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
