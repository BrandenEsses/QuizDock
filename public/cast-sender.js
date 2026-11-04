// Native Google Cast requires a registered Custom Web Receiver application ID.
// Without it, the TV-only tab works with Chrome's Cast tab feature.
let castAppId = "",
  castContext = null,
  directCastSession = null;
const castNamespace = "urn:x-cast:dev.ble.quizdock";
function castStatus(message) {
  const el = document.getElementById("castStatus");
  if (el) el.textContent = message;
}
async function sendCastRoom() {
  if (!castContext || !state?.code || mode !== "host") return;
  const message = { type: "room", code: state.code };
  try {
    if (directCastSession)
      await new Promise((resolve, reject) =>
        directCastSession.sendMessage(castNamespace, message, resolve, reject),
      );
    else {
      const session = castContext.getCurrentSession();
      if (!session) return;
      await session.sendMessage(castNamespace, message);
    }
  } catch (e) {
    castStatus("Unable to send room: " + (e.message || e.description || e));
  }
}
async function setupCast() {
  if (tvCode) return;
  const button = document.getElementById("castButton");
  document.getElementById("tvTab").onclick = () => {
    if (!state?.code) return castStatus("Create a room first.");
    window.open(
      "/display/" + encodeURIComponent(state.code),
      "_blank",
      "noopener",
    );
  };
  try {
    const res = await fetch("/api/cast-config");
    const config = await res.json();
    castAppId = config.appId;
    if (!castAppId) {
      castStatus(
        "Native Cast needs a registered Google Cast application ID. Use Open TV-only tab meanwhile.",
      );
      return;
    }
    if (!window.cast?.framework) {
      castStatus(
        "Google Cast SDK not ready or unsupported. Use desktop Chrome or cast the TV-only tab.",
      );
      return;
    }
    castContext = cast.framework.CastContext.getInstance();
    castContext.setOptions({
      receiverApplicationId: castAppId,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });
    button.disabled = false;
    castStatus(
      "Cast SDK ready. Click Cast to list video-capable Chromecast/Google TV displays.",
    );
    button.onclick = async () => {
      if (!state?.code) return castStatus("Create a room first.");
      try {
        const request = new chrome.cast.SessionRequest(castAppId, [
          chrome.cast.Capability.VIDEO_OUT,
        ]);
        directCastSession = await new Promise((resolve, reject) =>
          chrome.cast.requestSession(resolve, reject, request),
        );
        await sendCastRoom();
        castStatus("TV connected to room " + state.code);
      } catch (e) {
        castStatus(
          "Cast cancelled or failed: " + (e.message || e.description || e),
        );
      }
    };
    castContext.addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      () => sendCastRoom(),
    );
  } catch (e) {
    castStatus("Cast setup failed: " + e.message);
  }
}
window.__onGCastApiAvailable = function (available) {
  if (available) setupCast();
  else
    castStatus(
      "Google Cast SDK is unavailable in this browser. Try desktop Chrome.",
    );
};
document.addEventListener("DOMContentLoaded", () => {
  if (!tvCode)
    setTimeout(() => {
      if (!castContext) setupCast();
    }, 1500);
});
