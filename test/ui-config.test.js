import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Cast sender requests a video display", () => {
  assert.match(
    read("public/cast-sender.js"),
    /chrome\.cast\.Capability\.VIDEO_OUT/,
  );
  assert.match(read("public/cast-sender.js"), /new chrome\.cast\.ApiConfig/);
  assert.match(read("public/cast-sender.js"), /chrome\.cast\.initialize/);
  assert.doesNotMatch(
    read("public/cast-sender.js"),
    /cast\.framework\.CastContext/,
  );
});

test("Cast configuration rejects malformed receiver application IDs", () => {
  assert.match(read("server.js"), /\^\[0-9A-F\]\{8\}\$/);
  assert.match(read("server.js"), /requiredCapability: "VIDEO_OUT"/);
});

test("all display clients render the automated round deadline", () => {
  assert.match(read("public/index.html"), /state\.roundDeadline/);
  assert.match(read("public/cast-receiver.html"), /gameState\.roundDeadline/);
});

test("board, Final reveal, and incorrect-response sounds are packaged", () => {
  for (const file of [
    "public/sounds/board-fill.mp3",
    "public/sounds/appear.mp3",
    "public/sounds/final_jeopardy.mp3",
    "public/sounds/no.mp3",
  ])
    assert.ok(fs.statSync(new URL(`../${file}`, import.meta.url)).size > 1000);
});

test("host exposes configurable doubled timers and synchronized buzzers", () => {
  const page = read("public/index.html"),
    server = read("server.js");
  assert.match(page, /id="timerSettingsPanel"/);
  assert.match(page, /socket\.emit\("timerSettings"/);
  assert.match(page, /buzzOpensAt/);
  assert.match(server, /socket\.on\("timerSettings"/);
  assert.match(server, /oneWayLatencyMs/);
  assert.match(server, /}, 300\);/);
});

test("media is automatic, midpoint scheduled, and persistent on Cast", () => {
  const page = read("public/index.html"),
    cast = read("public/cast-receiver.html");
  assert.doesNotMatch(page, /id="releaseMedia"/);
  assert.match(page, /duration \* 500/);
  assert.match(cast, /clueMediaKey/);
  assert.match(cast, /function stopMedia/);
});
