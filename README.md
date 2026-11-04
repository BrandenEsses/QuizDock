# QuizDock v1.5

Dockerized real-time Jeopardy-style trivia. Supports multiplayer phones, single-player, two distinct AI-generated rounds, automatic advisory AI answer checks, custom game JSON, Cast V4, Android sender sources, and private rejoin links. No narration.

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

## Play

Host creates a room. For solo, press **Enable single-player** before anyone joins. For multiplayer, players join from their phones and buzz in. When a response is submitted, QuizDock automatically requests an AI suggestion. The suggestion is advisory only: it never awards or deducts points, and the human host always chooses Correct/Incorrect or Accept/Reject. If AI is unavailable, play continues normally.

Custom game import format (the two rounds must be distinct):

```json
{"title":"Physics","jeopardy":{"categories":[{"name":"Units","clues":[["SI unit of force","newton"]]}]},"doubleJeopardy":{"categories":[{"name":"Poetry","clues":[["A fourteen-line form","sonnet"]]}]},"final":{"clue":"This city is Mongolia's capital.","answer":"Ulaanbaatar"}}
```

## Important limitations

This is an experimental prototype, not a public production service. Room state is in memory and lost on restart. There are no rate limits or board persistence. Generation includes an AI editorial/factual-review pass plus local structural and similarity validation, but AI output can still be wrong; review important games before play. The host opens buzzers and makes every scoring decision. Network latency determines buzzer arrival order. Protect port 3000 with LAN/VPN until hardened.


## v0.4: TV spectator and handwritten Final Jeopardy

Open `https://quizdock.ble.dev/display/ROOMCODE` in Chrome and use Chrome's Cast tab feature to send the clean board and contestant scores to a Chromecast. This is browser tab casting, not a native Google Cast receiver. Spectators are read-only.

During Final Jeopardy, players may write on a touch canvas or type a response. The host sees the original handwritten image and may request an AI transcription/judging **suggestion**, then independently accepts or rejects each response. Handwriting images are sent to OpenAI only when the host requests an AI suggestion. They remain in server memory for the life of the room. Do not use this build for public internet rooms: host socket authentication and rate limits are not production hardened.


## Chromecast / Google TV Streamer (v0.5)

**Immediate fallback:** Host creates a room, clicks **Open TV-only tab**, and uses Chrome's **Cast tab** on that tab. The host control tab remains separate.

**Native Cast button:** Register a **Custom Web Receiver** at https://cast.google.com/publish/ and set the receiver URL to `https://quizdock.ble.dev/cast-receiver`. Copy its **application ID** into `/opt/quizdock/.env` as `CAST_APP_ID=...`, then run `docker compose up -d --build`. Google Cast developer registration and receiver approval/device registration may be required for testing. The sender needs a compatible Google Cast-enabled browser and network discovery; on unsupported devices use the TV-only tab. The receiver loads `/display/<room>` independently and receives the room code over the custom Cast namespace. HTTPS and reachability from the Cast device are required.

**Caution:** Native Cast requires real-device validation and has not been hardware-tested here. The host session remains ephemeral: refreshing/disconnecting the host closes the room in this prototype.


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
