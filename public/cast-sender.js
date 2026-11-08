// QuizDock uses the Google Cast Base Sender API so VIDEO_OUT is part of the
// discovery request itself. This keeps audio-only routes out of the picker.
let castAppId = "",
  directCastSession = null,
  castInitialized = false,
  castInitializing = false;
const castNamespace = "urn:x-cast:dev.ble.quizdock";
function castStatus(message) {
  const el = document.getElementById("castStatus");
  if (el) el.textContent = message;
}
async function sendCastRoom() {
  if (!directCastSession || !state?.code || mode !== "host") return;
  const message = { type: "room", code: state.code };
  try {
    await new Promise((resolve, reject) =>
      directCastSession.sendMessage(castNamespace, message, resolve, reject),
    );
  } catch (error) {
    castStatus(
      "Unable to send room: " +
        (error.message || error.description || String(error)),
    );
  }
}
function rememberCastSession(session) {
  directCastSession = session;
  session.addUpdateListener((alive) => {
    if (!alive && directCastSession === session) directCastSession = null;
  });
  void sendCastRoom();
}
async function setupCast() {
  if (tvCode || castInitialized || castInitializing) return;
  castInitializing = true;
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
    const res = await fetch("/api/cast-config"),
      config = await res.json();
    castAppId = config.appId;
    if (config.error) {
      castInitializing = false;
      castStatus(config.error + " Use Open TV-only tab meanwhile.");
      return;
    }
    if (!castAppId) {
      castInitializing = false;
      castStatus(
        "Native Cast needs a registered Google Cast application ID. Use Open TV-only tab meanwhile.",
      );
      return;
    }
    if (!window.chrome?.cast) {
      castInitializing = false;
      castStatus(
        "Google Cast SDK not ready or unsupported. Use a Cast-enabled Chrome browser or cast the TV-only tab.",
      );
      return;
    }
    const request = new chrome.cast.SessionRequest(castAppId, [
        chrome.cast.Capability.VIDEO_OUT,
      ]),
      apiConfig = new chrome.cast.ApiConfig(
        request,
        rememberCastSession,
        (availability) => {
          const available =
            availability === chrome.cast.ReceiverAvailability.AVAILABLE;
          button.disabled = !available;
          castStatus(
            available
              ? `Video Cast displays found for receiver ${castAppId}.`
              : `No compatible video Cast displays found for receiver ${castAppId}. Check Wi-Fi and receiver registration.`,
          );
        },
        chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      );
    await new Promise((resolve, reject) =>
      chrome.cast.initialize(apiConfig, resolve, reject),
    );
    castInitialized = true;
    castInitializing = false;
    castStatus(
      `Cast initialized for video displays with receiver ${castAppId}. Searching…`,
    );
    button.onclick = async () => {
      if (!state?.code) return castStatus("Create a room first.");
      try {
        const session = await new Promise((resolve, reject) =>
          chrome.cast.requestSession(resolve, reject),
        );
        rememberCastSession(session);
        await sendCastRoom();
        castStatus("TV connected to room " + state.code);
      } catch (error) {
        castStatus(
          "Cast cancelled or failed: " +
            (error.message || error.description || String(error)),
        );
      }
    };
  } catch (error) {
    castInitializing = false;
    castStatus(
      "Cast setup failed: " +
        (error.message || error.description || String(error)),
    );
  }
}
window.__onGCastApiAvailable = function (available) {
  if (available) void setupCast();
  else
    castStatus(
      "Google Cast SDK is unavailable in this browser. Try another Cast-enabled Chrome browser.",
    );
};
document.addEventListener("DOMContentLoaded", () => {
  if (!tvCode)
    setTimeout(() => {
      if (!castInitialized) void setupCast();
    }, 1500);
});
