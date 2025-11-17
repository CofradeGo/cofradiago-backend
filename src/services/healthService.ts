import type { HealthStatus } from "../models/HealthStatus.ts";

export const healthService = {
  getStatus(): HealthStatus {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  },
};
