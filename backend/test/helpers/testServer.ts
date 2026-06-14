import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";

import { createApp } from "../../src/app.js";

export type TestServer = {
  baseUrl: string;
  wsUrl: string;
  server: ServerType;
  close: () => Promise<void>;
};

export async function startTestServer(): Promise<TestServer> {
  const { app, injectWebSocket } = createApp();

  return new Promise((resolve, reject) => {
    const server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      injectWebSocket(server);
      resolve({
        baseUrl: `http://localhost:${info.port}`,
        wsUrl: `ws://localhost:${info.port}`,
        server,
        close: () =>
          new Promise<void>((res, rej) =>
            server.close((err) => (err ? rej(err) : res())),
          ),
      });
    });

    server.on("error", reject);
  });
}
