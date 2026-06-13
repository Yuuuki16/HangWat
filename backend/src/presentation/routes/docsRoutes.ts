import { Hono } from "hono";

import { openApiSpec } from "../openapi/openApiSpec.js";

const swaggerUiVersion = "5.32.6";
const swaggerUiCssIntegrity = "sha384-9Q2fpS+xeS4ffJy6CagnwoUl+4ldAYhOs9pgZuEKxypVModhmZFzeMlvVsAjf7uT";
const swaggerUiBundleIntegrity = "sha384-EYdOaiRwn44zNjrw+Tfs06qYz9BGQVo2f4/pLY5i7VorbjnZNhdplAbTBk8FXHUJ";

export function createDocsRoutes() {
  const app = new Hono();

  app.get("/openapi.json", (c) => {
    return c.json(openApiSpec);
  });

  app.get("/docs", (c) => {
    return c.html(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HangWat API Docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui.css"
      integrity="${swaggerUiCssIntegrity}"
      crossorigin="anonymous"
    />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script
      src="https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui-bundle.js"
      integrity="${swaggerUiBundleIntegrity}"
      crossorigin="anonymous"
    ></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
      });
    </script>
  </body>
</html>`);
  });

  return app;
}
