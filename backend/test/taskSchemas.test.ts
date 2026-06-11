import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCreateTaskBody } from "../src/presentation/schemas/taskSchemas.js";

describe("parseCreateTaskBody", () => {
  it("accepts valid task input", () => {
    const result = parseCreateTaskBody({
      title: "  Buy milk  ",
      description: "  Remember lactose-free  ",
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.data, {
      title: "Buy milk",
      description: "Remember lactose-free",
    });
  });

  it("rejects missing title", () => {
    const result = parseCreateTaskBody({ description: "memo" });

    assert.equal(result.ok, false);
    assert.equal(result.error, "title is required");
  });

  it("rejects non-object body", () => {
    const result = parseCreateTaskBody(null);

    assert.equal(result.ok, false);
    assert.equal(result.error, "request body must be an object");
  });
});
