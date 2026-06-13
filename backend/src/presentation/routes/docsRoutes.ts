import { Hono } from "hono";

import { openApiSpec } from "../openapi/openApiSpec.js";

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
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
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
