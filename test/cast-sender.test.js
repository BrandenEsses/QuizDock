import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../public/cast-sender.js", import.meta.url),
  "utf8",
);

test("Cast discovery initializes with the registered app and VIDEO_OUT", async () => {
  const elements = {
      castButton: { disabled: true },
      castStatus: { textContent: "" },
      tvTab: {},
    },
    document = {
      getElementById: (id) => elements[id],
      addEventListener: () => {},
    };
  let sessionRequest, apiConfig;
  class SessionRequest {
    constructor(appId, capabilities) {
      sessionRequest = { appId, capabilities };
    }
  }
  class ApiConfig {
    constructor(request, sessionListener, receiverListener, autoJoinPolicy) {
      apiConfig = {
        request,
        sessionListener,
        receiverListener,
        autoJoinPolicy,
      };
      Object.assign(this, apiConfig);
    }
  }
  const chrome = {
      cast: {
        Capability: { VIDEO_OUT: "video_out" },
        ReceiverAvailability: { AVAILABLE: "available" },
        AutoJoinPolicy: { ORIGIN_SCOPED: "origin_scoped" },
        SessionRequest,
        ApiConfig,
        initialize: (config, success) => {
          config.receiverListener("available");
          success();
        },
      },
    },
    window = { chrome, open: () => {} },
    load = new Function(
      "document",
      "window",
      "chrome",
      "fetch",
      "setTimeout",
      `const state={code:"123456"},mode="host",tvCode=null;${source};return {setupCast};`,
    ),
    sender = load(
      document,
      window,
      chrome,
      async () => ({
        json: async () => ({ appId: "CE3F2716" }),
      }),
      () => {},
    );

  await sender.setupCast();

  assert.deepEqual(sessionRequest, {
    appId: "CE3F2716",
    capabilities: ["video_out"],
  });
  assert.equal(apiConfig.autoJoinPolicy, "origin_scoped");
  assert.equal(elements.castButton.disabled, false);
  assert.match(elements.castStatus.textContent, /video displays/i);
});
