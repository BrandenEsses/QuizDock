import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(
  new URL("../server.js", import.meta.url),
  "utf8",
);
const html = fs.readFileSync(
  new URL("../public/index.html", import.meta.url),
  "utf8",
);

test("validator exposes self-documenting GET and machine-readable POST routes", () => {
  assert.match(server, /app\.get\("\/api\/validate-game"/);
  assert.match(server, /app\.post\("\/api\/validate-game"/);
  assert.match(server, /issueCount/);
  assert.match(server, /suggestion/);
  assert.match(server, /status\(422\)/);
});

test("board designer validates before creating or loading a room", () => {
  assert.match(html, /id="designerValidate"/);
  assert.match(html, /async function validateDesigner/);
  assert.match(html, /fetch\("\/api\/validate-game"/);
  assert.match(html, /if \(!\(await validateDesigner\(\)\)\) return/);
});
