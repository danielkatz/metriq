import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MetriqModule } from "@metriq/nestjs";

describe("AppController", () => {
    let appController: AppController;
    let appService: AppService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [MetriqModule.forRoot({ metricsPath: "/metrics" })],
            controllers: [AppController],
            providers: [AppService],
        }).compile();

        appController = app.get<AppController>(AppController);
        appService = app.get<AppService>(AppService);
    });

    describe("root", () => {
        it('should return "Hello World!"', () => {
            const counter = appService["helloCounter"];
            expect(appController.getHello()).toBe("Hello World!");
            expect(counter.getDebugValue({ hello: "world" })).toBe(1);
        });
    });
});
