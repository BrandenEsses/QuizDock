import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Cast sender requests a video display", () => {
  assert.match(read("public/cast-sender.js"), /chrome\.cast\.Capability\.VIDEO_OUT/);
});

test("all display clients render the automated round deadline", () => {
  assert.match(read("public/index.html"), /state\.roundDeadline/);
  assert.match(read("public/cast-receiver.html"), /gameState\.roundDeadline/);
});

test("new board and Final reveal sounds are packaged", () => {
  for (const file of ["public/sounds/board-fill.mp3", "public/sounds/appear.mp3"])
    assert.ok(fs.statSync(new URL(`../${file}`, import.meta.url)).size > 1000);
});
