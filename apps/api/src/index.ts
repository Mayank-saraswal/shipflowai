import http from "node:http";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";

import { env } from "./env";

async function init() {
  try {
    const server = http.createServer(expressApplication);
    const PORT: number = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => {
      logger.info(`🚀 ShipFlow AI API running on PORT ${PORT}`);
      logger.info(`📚 API docs: http://localhost:${PORT}/docs`);
      logger.info(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
      logger.info(`⚡ Inngest endpoint: http://localhost:${PORT}/api/inngest`);
    });
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}

init();
