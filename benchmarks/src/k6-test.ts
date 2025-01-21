import http from "k6/http";
import { Options } from "k6/options";
import { check } from "k6";

const cardinality = 1000000;
const timeout = "30s";

export const options: Options = {
    vus: 1,
    iterations: 10,
};

const BASE_URL = "http://metrics-server:3001";

export default function () {
    const cardinalityRes = http.post(`${BASE_URL}/cardinality/${cardinality}`, {
        timeout,
    });
    check(cardinalityRes, {
        "cardinality status is 200": (r) => r.status === 200,
    });

    // Update counters
    const updateRes = http.post(`${BASE_URL}/update`, {
        timeout,
    });
    check(updateRes, {
        "update status is 200": (r) => r.status === 200,
    });

    // Get metrics from both endpoints
    const metriqRes = http.get(`${BASE_URL}/metriq`, {
        timeout,
    });
    check(metriqRes, {
        "metriq status is 200": (r) => r.status === 200,
    });

    const promClientRes = http.get(`${BASE_URL}/prom-client`, {
        timeout,
    });
    check(promClientRes, {
        "prom-client status is 200": (r) => r.status === 200,
    });
}
