import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDocsRoutes } from "../src/presentation/routes/docsRoutes.js";

describe("docsRoutes", () => {
  it("returns OpenAPI specification", async () => {
    const app = createDocsRoutes();
    const response = await app.request("/openapi.json");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type")?.includes("application/json"), true);

    const body = await response.json();
    assert.equal(body.openapi, "3.1.0");
    assert.equal(body.info.title, "HangWat API");
    assert.ok(body.paths["/health"]);
  });

  it("returns Swagger UI page", async () => {
    const app = createDocsRoutes();
    const response = await app.request("/docs");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type")?.includes("text/html"), true);
    assert.match(await response.text(), /SwaggerUIBundle/);
  });
});
