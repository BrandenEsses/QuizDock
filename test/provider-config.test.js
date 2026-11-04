import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("uses the current Freesound API v2 search endpoint", () => {
  const server = fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );
  assert.match(server, /https:\/\/freesound\.org\/apiv2\/search\/\?query=/);
  assert.doesNotMatch(server, /freesound\.org\/apiv2\/search\/text\//);
});

test("requires provider metadata to match the canonical media answer", () => {
  const server = fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );
  assert.match(server, /result\.photos\?\.find/);
  assert.match(server, /mediaMatch\(query, item\.alt/);
  assert.match(server, /candidate\.pair\[0\] = essentialMediaClue/);
});
