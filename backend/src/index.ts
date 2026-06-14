import "dotenv/config";

import { serve } from "@hono/node-server";

import { createApp } from "./app.js";

const rawPort = process.env.PORT ?? process.env.BACKEND_PORT ?? "4000";
const port = Number.parseInt(rawPort, 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid port: ${rawPort}`);
}

const { app, injectWebSocket } = createApp();

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Backend listening on http://localhost:${info.port}`);
  },
);

injectWebSocket(server);
