import { createApp } from "../../src/app.js";

export function createTestApp() {
  const { app } = createApp();
  return app;
}
