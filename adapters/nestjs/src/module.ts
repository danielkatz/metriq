import { DynamicModule, Module } from "@nestjs/common";
import { MetricsOptions, metriq } from "metriq";
import { METRIQ } from "./constants";
import { MetricsController } from "./controller";
import { MetricsService } from "./service";

export interface MetriqModuleOptions extends MetricsOptions {
    global: boolean;
    metricsPath: string;
}

@Module({})
export class MetriqModule {
    static forRoot(options: Partial<MetriqModuleOptions> = {}): DynamicModule {
        const { global = false, metricsPath = "/metrics", ...metriqOptions } = options;

        return {
            module: MetriqModule,
            global,
            providers: [
                {
                    provide: METRIQ,
                    useFactory: () => {
                        const module = metriq(metriqOptions);
                        Reflect.defineMetadata("path", metricsPath, MetricsController);
                        return module;
                    },
                },
                MetricsService,
                MetricsController,
            ],
            exports: [METRIQ, MetricsService, MetricsController],
        };
    }
}
