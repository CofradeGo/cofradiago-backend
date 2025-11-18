import type { HealthStatus } from "../models/HealthStatus.ts";

export const healthService = {
  getStatus(): HealthStatus {
    return {
      status: "200 - OK",
      timestamp: new Date().toISOString(),
    };
  },
};
