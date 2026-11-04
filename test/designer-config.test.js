import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(
  new URL("../public/index.html", import.meta.url),
  "utf8",
);

test("host setup includes a visual board designer", () => {
  assert.match(html, /id="designerPanel"/);
  assert.match(html, /id="designerRoot"/);
  assert.match(html, /blankDesignerGame/);
  assert.match(html, /data-round="jeopardy"/);
  assert.match(html, /data-round="doubleJeopardy"/);
  assert.match(html, /Final Jeopardy/);
});

test("landing page opens the designer without creating a room", () => {
  assert.match(html, /id="openDesigner"/);
  assert.match(html, /id="designerWorkspace"/);
  assert.match(html, /showStandaloneDesigner/);
  assert.match(
    html,
    /Design and download a complete board without creating a room/,
  );
  assert.match(html, /Start room with this game/);
});

test("designer can upload, download, and load game JSON", () => {
  assert.match(html, /id="designerUpload"/);
  assert.match(html, /id="designerDownload"/);
  assert.match(html, /id="designerFile"[^>]+application\/json/);
  assert.match(html, /id="designerLoad"/);
  assert.match(html, /normalizeDesignerGame/);
  assert.match(html, /JSON\.stringify\(designerGame, null, 2\)/);
  assert.match(html, /importFullGame\(designerGame/);
});

test("designer supports native clue and Final media metadata", () => {
  assert.match(html, /\["image", "audio", "video"\]/);
  assert.match(
    html,
    /\["type", "url", "alt", "provider", "credit", "license", "source"\]/,
  );
  assert.match(html, /data-media=/);
  assert.match(html, /data-final-media/);
});
