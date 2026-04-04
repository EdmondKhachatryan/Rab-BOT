import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import pino from "pino";
import { config } from "../config/index.js";

function buildLogger(): pino.Logger {
  if (config.logToFile) {
    const dir = dirname(config.logFilePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return pino(
      { level: config.logLevel },
      pino.multistream([
        {
          level: config.logLevel,
          stream: pino.transport({
            target: "pino-pretty",
            options: { translateTime: "SYS:standard" }
          })
        },
        {
          level: config.logLevel,
          stream: pino.destination({ dest: config.logFilePath, sync: false })
        }
      ])
    );
  }

  return pino({
    level: config.logLevel,
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "SYS:standard"
      }
    }
  });
}

export const logger = buildLogger();
