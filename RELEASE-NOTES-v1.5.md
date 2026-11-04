# QuizDock v1.5

- Generates separate Jeopardy and Double Jeopardy boards. Category concepts must differ across rounds.
- Uses a generation pass, an independent editorial/validation pass, and local similarity checks to reject repeated categories, clues, and answers.
- Automatically requests advisory AI answer suggestions for normal and Final Jeopardy responses. Suggestions never change scores; the host still chooses Correct/Incorrect or Accept/Reject.
- Defaults board work to `gpt-6.1-sol` with high reasoning and answer checks to `gpt-6-luna` with low reasoning. Both are configurable.
- Preserves Cast V4, Android sources/build profile, host/player rejoin links, and clean installer behavior from v1.4.
- Includes `game-content.js` in the server image and waits for a healthy server before Cast verification.
- Ensures every structured Responses API request explicitly requests JSON in the user input, as required by `json_object` mode.

## Upgrade / clean deployment

Copy `quizdock-v1.5-complete.zip` to `/opt/quizdock-v1.5-complete.zip`, then run:

```sh
unzip -p /opt/quizdock-v1.5-complete.zip quizdock/install-v1.5.sh | sudo bash
```

To rebuild the Android APK too, append `-s -- --apk` to the `sudo bash` invocation, or after deployment run `cd /opt/quizdock && docker compose --profile build-apk run --rm --build --no-deps apk-builder`.

Your existing `/opt/quizdock/.env`, downloads, Android signing/build state, and a timestamped backup are preserved by the installer.
