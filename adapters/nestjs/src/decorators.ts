import { Inject } from "@nestjs/common";
import { METRIQ } from "./constants";

export const InjectMetriq = () => Inject(METRIQ);
