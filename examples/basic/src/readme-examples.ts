/* eslint-disable @typescript-eslint/no-unused-vars */
import { metriq } from "metriq";

// 🔧 Configuration

const metrics = metriq({
    // Common prefix for all metrics
    commonPrefix: "myapp_",

    // Default labels added to all metrics
    commonLabels: { app: "api", env: "prod" },

    // Default TTL for all metrics
    defaultTtl: 3600000,

    // Enable internal metrics
    enableInternalMetrics: true,
});

// 📊 Instruments
// Counter

const counter = metrics.createCounter("counter", "help text");

// Increment without labels
counter.increment();
counter.increment(5);

// Increment with labels
counter.increment({ path: "/api" });
counter.increment({ path: "/api" }, 5);

// Remove specific metric
counter.remove({ path: "/api" });

// Remove all metrics
counter.removeAll();

// Gauge

const gauge = metrics.createGauge("gauge", "help text");

// Set/increment without labels
gauge.set(42);
gauge.increment();
gauge.increment(5);

// Set/increment with labels
gauge.set({ service: "api" }, 42);
gauge.increment({ service: "api" });
gauge.increment({ service: "api" }, 5);

// Remove/clear
gauge.remove({ service: "api" });
gauge.removeAll();

// Histogram

const histogram = metrics.createHistogram("histogram", "help text", { buckets: [0.1, 0.5, 1, 2, 5] });

// Observe without labels
histogram.observe(0.123);

// Observe with labels
histogram.observe({ status: "200" }, 0.123);

// Remove/clear
histogram.remove({ status: "200" });
histogram.removeAll();

// 📊 Registry

const registry = metrics.createRegistry({
    // Common prefix for all metrics in this registry
    commonPrefix: "myapp_",

    // Default labels added to all metrics in this registry
    commonLabels: { app: "api", env: "prod" },

    // Default TTL for all metrics in this registry
    defaultTtl: 3600000,
});

// Create a counter in the registry
registry.createCounter("counter", "help text");
