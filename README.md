# QuizDock v2.2

Dockerized real-time Jeopardy-style trivia. Supports multiplayer phones, contestant-controlled Autohost games, Daily Doubles, sound cues, single-player, two distinct AI-generated rounds, automatic advisory AI answer checks, reusable game JSON/ZIP bundles, provider-backed native media clues, Cast V4, and private rejoin links.

## Deploy

```sh
unzip quizdock-v1.5-complete.zip
cd quizdock
cp .env.example .env
nano .env  # paste API key; do not share it
chmod 600 .env
docker compose up -d --build
```

Open http://SERVER:3000. If the zip extracts into `quizdock/`, run `cd quizdock` before Docker commands. Use an HTTPS reverse proxy or VPN when accessing across the Internet.

## OpenAI API key

1. Create an API key at https://platform.openai.com/api-keys (API billing is separate from ChatGPT subscriptions).
2. Add `OPENAI_API_KEY=sk-...` to `.env` on your server. Do **not** put the key in HTML, JavaScript, board JSON, or Git.
3. Optional: tune `OPENAI_BOARD_MODEL`, `OPENAI_BOARD_REASONING`, `OPENAI_JUDGE_MODEL`, and `OPENAI_JUDGE_REASONING`.
4. Restart after changing `.env`: `docker compose up -d --force-recreate`.
5. Set an API project budget and monitor usage at https://platform.openai.com/usage.

The server sends AI requests; player browsers never receive the key. AI board generation can incur costs and should not be exposed publicly without authentication/rate limits.

## Free media provider keys

Media enrichment is optional and does not use generative AI. Create a Pexels API key at https://www.pexels.com/api/ for photos and short stock video, and a Freesound API credential at https://freesound.org/apiv2/apply for audio. Add them only to the server's `.env`:

```sh
PEXELS_API_KEY=...
FREESOUND_API_KEY=...
```

Restart with `docker compose up -d --force-recreate`. If neither key is configured, game generation still succeeds with text-only clues. The generator's **Media clues** setting controls the requested count from zero through six. Provider files are downloaded into `downloads/generated/`, provider credit/license/source metadata stays with the clue, and matching generation requests remain cached to avoid repeat AI and provider usage. Review each result before playing because stock search can return an irrelevant or answer-revealing asset.

## Play

Host creates a room. For solo, press **Enable single-player** before anyone joins. For multiplayer, players join from their phones and buzz in. Reading, buzzing, and answering have automatic countdowns. In manual-host mode, AI suggestions remain advisory and the human host chooses Correct/Incorrect or Accept/Reject. In **Automated host** mode, a random contestant chooses the first clue from a phone-friendly board; control then passes to the last contestant with a correct response. Autohost handles timers, round advancement, and clear AI scoring decisions. Uncertain decisions do not change the score, and if AI is unavailable Autohost reveals the answer without changing the score.

Each standard 30-clue game hides one Daily Double in Jeopardy and two in Double Jeopardy. Only the contestant who selected it can wager and answer. The wager is $5 through the greater of that contestant's score or $1,000 in Jeopardy/$2,000 in Double Jeopardy. After wagering, the clue is shown for six seconds of reading time before the five-second response window begins. Both intervals are configurable.

In Automated host mode, Jeopardy and Double Jeopardy each receive a ten-minute round clock (`ROUND_SECONDS=600`). The remaining round time appears on host, contestant, TV-only, and Cast receiver screens; expiry plays the timeout cue and advances the game. Standard answers, Final wagers, and typed Final responses are privately saved while the contestant types so another contestant's submission cannot clear the form, and a typed standard answer is automatically submitted when its answer window expires.

Use **Download game JSON** to save the current two rounds, Final Jeopardy, media references, and generation settings. **Download game + media ZIP** adds `game.json`, a README, and every local media asset used by the game. Custom external HTTPS media remains remote and is listed in the bundle README. **Load game JSON** restores the saved game. **Load generation settings** only repopulates the AI form, allowing edits and a completely new generation without loading the old clues. Daily Double locations are randomized afresh when a game is loaded.

The host setup screen also includes a **Visual board designer**. Start with a blank 6-category by 5-clue board, edit either round, add or remove categories and clues, fill in Final Jeopardy, and optionally attach image, audio, or video metadata. **Edit current game** copies the room's current board into the form. The designer can upload an existing QuizDock JSON file, download the work in progress as reusable JSON, or validate and load it directly into the room. Empty clues and invalid media URLs can still be saved as a draft, but must pass the normal game validator before they can be played.

Custom game import format (the two rounds must be distinct):

```json
{
  "title": "Physics",
  "jeopardy": {
    "categories": [
      { "name": "Units", "clues": [["SI unit of force", "newton"]] }
    ]
  },
  "doubleJeopardy": {
    "categories": [
      { "name": "Poetry", "clues": [["A fourteen-line form", "sonnet"]] }
    ]
  },
  "final": {
    "clue": "This city is Mongolia's capital.",
    "answer": "Ulaanbaatar"
  }
}
```

Custom games may add image, audio, or video media as the third clue item. Media URLs must use HTTPS or begin with `/downloads/`; generated games intentionally do not invent media URLs.

```json
[
  "Identify this instrument from the clip.",
  "theremin",
  {
    "type": "audio",
    "url": "https://example.org/theremin.mp3",
    "alt": "Short instrument clip"
  }
]
```

The text remains the actual clue (for example, “What song is this?”), while the third item supplies the accompanying media. QuizDock uses native `<img>`, `<audio>`, and `<video>` elements instead of arbitrary iframes so saved games remain portable and untrusted pages cannot run inside the game. The built-in sample game contains a packaged image clue so this behavior can be tested without an external URL. Provider media must now match every significant word in the canonical answer's provider label/tags; unmatched results are discarded rather than attached. Once an asset passes that check, QuizDock replaces the original clue with a media-dependent identification prompt so the asset is essential rather than decorative. For every board media clue, the contestant who selected it receives a **Show / play media** control. The host, TV, and other contestants wait on the text prompt; the media and response timers are released together only after that contestant taps the button. On a media Daily Double, this happens after the wager and before its separate reading interval.

The TV display shows who buzzed, their submitted response, and the correct response after scoring. After every Final Jeopardy response has been scored, it announces the winner or co-winners. Included sound cues cover Daily Doubles, timeouts, round endings, and Final Jeopardy. Browsers require one click or tap before playing sound; use the visible sound button on the host or TV display.

Board generation reports rough progress. When local validation identifies a duplicated, answer-leaking, or otherwise conflicting clue, QuizDock requests up to three small single-clue replacements before considering a new full-board attempt.

## Important limitations

This is an experimental prototype, not a public production service. Room state is in memory and lost on restart. There are no rate limits or server-side board persistence. Generation uses one schema-constrained, self-audited AI pass plus local structural, answer-leakage, and similarity validation; a failed local check can trigger a full retry. AI output can still be wrong, so review important games before play. Matching requests are cached in memory for one hour by default. Network latency determines buzzer arrival order. Protect port 3000 with LAN/VPN until hardened.

## v0.4: TV spectator and handwritten Final Jeopardy

Open `https://quizdock.ble.dev/display/ROOMCODE` in Chrome and use Chrome's Cast tab feature to send the clean board and contestant scores to a Chromecast. This is browser tab casting, not a native Google Cast receiver. Spectators are read-only.

During Final Jeopardy, players may write on a touch canvas or type a response. The host sees the original handwritten image and may request an AI transcription/judging **suggestion**, then independently accepts or rejects each response. Handwriting images are sent to OpenAI only when the host requests an AI suggestion. They remain in server memory for the life of the room. Do not use this build for public internet rooms: host socket authentication and rate limits are not production hardened.

## Chromecast / Google TV Streamer (v0.5)

**Immediate fallback:** Host creates a room, clicks **Open TV-only tab**, and uses Chrome's **Cast tab** on that tab. The host control tab remains separate.

**Native Cast button:** Register a **Custom Web Receiver** at https://cast.google.com/publish/ and set the receiver URL to `https://quizdock.ble.dev/cast-receiver`. Copy its **application ID** into `/opt/quizdock/.env` as `CAST_APP_ID=...`, then run `docker compose up -d --build`. Google Cast developer registration and receiver approval/device registration may be required for testing. The sender needs a compatible Google Cast-enabled browser and network discovery; on unsupported devices use the TV-only tab. The receiver loads `/display/<room>` independently and receives the room code over the custom Cast namespace. HTTPS and reachability from the Cast device are required.

**Caution:** Native Cast requires real-device validation and has not been hardware-tested here. The host session remains ephemeral: refreshing/disconnecting the host closes the room in this prototype.

QuizDock requests the `VIDEO_OUT` receiver capability so the native picker excludes audio-only speakers. An unpublished Custom Receiver is visible only to Cast devices registered in the same Google Cast Developer Console account; publish the receiver to make it available to all compatible display devices. The TV-only tab remains the fallback for tab casting.

## v0.6 display fixes

- Host keeps the category board visible while a clue is active; clue panel is separate from hidden setup controls.
- Player clue text stays on screen during buzz, answer, and judging phases.
- Cast diagnostics explain desktop Chrome and LAN discovery limitations. This release does **not** solve unsupported Android Chrome native sender discovery or network isolation.
- To cast without the custom receiver: open the TV-only tab in desktop Chrome, choose Cast tab, and return to the host tab.

## v0.7: Host reconnect and casting

Host sessions use a secret token saved in the host browser localStorage. Returning to the same host URL on the same browser/device automatically resumes the host role, including after switching tabs or temporary connection loss. Rooms stay alive for HOST_GRACE_SECONDS (default one hour) after the host disconnects. This is in-memory only: restarting the Docker container loses active rooms. Keep the host URL/token private; the token is a host credential.

**Casting limitation:** Native Google Cast Web Sender discovery is supported by desktop Chrome, not reliably by Chrome on Android. A registered Cast app ID alone cannot make Android Chrome discover devices. For now use a desktop Chrome tab cast of `/display/ROOMCODE`, or open that spectator URL directly in a TV browser. An Android-native Cast sender app would be needed for a robust one-tap Cast picker on phones.

## v0.8 host reconnection fixes

The host token is now saved at room creation and retained on every resume. The server includes the token in resume acknowledgements. Reconnect attempts use a timeout and host actions wait until authorization is restored. Existing rooms created under v0.7 may lack a saved token; create a fresh room after updating. Android Chrome is not a supported native Google Cast web sender; use desktop Chrome's Cast tab for now, or a future Android native sender.
