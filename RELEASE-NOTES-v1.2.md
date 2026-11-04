# QuizDock v1.2 beta

- Human host is sole authority on correct/incorrect judgments and scoring.
- AI suggestion button is optional and cannot alter scores or phases.
- Removed exact-match automatic scoring and automatic AI judging.
- Clue, buzzer, and contestant-answer phases no longer automatically time out or penalize players.
- Android asks for nearby Wi-Fi discovery permission on Android 13+, and location on older versions. This may help device discovery but does not guarantee it; ensure the receiver is on the same LAN, not guest/isolated Wi-Fi, and Cast app ID CE3F2716 is registered and receiver URL is correct.
- No claim that physical Chromecast casting was tested.

Run: cd /opt && unzip -p quizdock-v1.2-bundle.zip quizdock/install-v1.2.sh | bash
