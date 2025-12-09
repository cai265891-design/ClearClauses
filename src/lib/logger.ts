import { randomUUID } from "crypto";

export type LogLevel = "info" | "warn" | "error";

export interface Logger {
  traceId: string;
  label?: string;
  log: (level: LogLevel, message: string, meta?: Record<string, unknown>) => void;
}

export function createLogger(label?: string): Logger {
  const traceId = randomUUID();
  return {
    traceId,
    label,
    log: (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
      const payload = {
        level,
        traceId,
        label,
        message,
        meta,
        timestamp: new Date().toISOString(),
      };
      // 使用 console 便于本地与 Vercel 采集
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload));
    },
  };
}
