import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initFirebase } from "./config/firebase";
import { initSocket } from "./sockets";

async function bootstrap() {
  await connectDB();
  initFirebase();

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`[server] Listening on port ${env.PORT} (${env.NODE_ENV})`);
    console.log(`[server] Health check: http://localhost:${env.PORT}/health`);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[server] Unhandled promise rejection:", reason);
  });
}

bootstrap().catch((err) => {
  console.error("[server] Fatal error during startup:", err);
  process.exit(1);
});
