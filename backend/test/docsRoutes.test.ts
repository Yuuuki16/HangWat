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
    assert.ok(body.paths["/api/events/{eventId}/candidates"]?.post);
    assert.ok(
      body.paths["/api/events/{eventId}/candidates/{candidateId}"]?.patch,
    );
    assert.ok(
      body.paths["/api/events/{eventId}/candidates/{candidateId}"]?.delete,
    );
    assert.ok(
      body.paths["/api/events/{eventId}/candidates/{candidateId}/confirm"]
        ?.post,
    );
    assert.ok(
      body.paths["/api/events/{eventId}/candidates/{candidateId}/comments"],
    );
    assert.ok(body.paths["/api/comments/{commentId}"]);
    assert.ok(body.paths["/api/comments/{commentId}/like"]?.put);
    assert.ok(body.paths["/api/comments/{commentId}/like"]?.delete);
  });

  it("returns Swagger UI page", async () => {
    const app = createDocsRoutes();
    const response = await app.request("/docs");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type")?.includes("text/html"), true);

    const body = await response.text();
    assert.match(body, /SwaggerUIBundle/);
    assert.match(body, /swagger-ui-dist@5\.32\.6/);
    assert.match(body, /integrity="sha384-/);
    assert.match(body, /crossorigin="anonymous"/);
  });
});
