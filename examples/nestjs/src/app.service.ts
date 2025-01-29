import { Injectable } from "@nestjs/common";
import { Counter, Metrics } from "metriq";
import { InjectMetriq } from "@metriq/nestjs";

type HelloCounterLabels = { hello: string };

@Injectable()
export class AppService {
    private readonly helloCounter: Counter<HelloCounterLabels>;

    constructor(@InjectMetriq() readonly metriq: Metrics) {
        this.helloCounter = metriq.createCounter<HelloCounterLabels>("hello_counter", "Hello counter");
    }

    getHello(): string {
        this.helloCounter.increment({ hello: "world" });
        return "Hello World!";
    }
}
