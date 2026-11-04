QuizDock v1.3: private per-person rejoin links.

Host links: https://quizdock.ble.dev/?host=123456#hostToken=<UUID>
Player links: https://quizdock.ble.dev/?room=123456#playerToken=<UUID>

Links are private bearer credentials. Sharing one transfers control of that seat. UUID fragments aren't sent in HTTP requests, but can be accessed by browser extensions or scripts on the page. Do not share publicly. Only the current server process holds rooms: Docker restarts still destroy ongoing games and invalidate these links. A host's role link is different from the public six-digit join code. Player rejoin keeps their score and existing player ID, disconnecting the old device's seat.

No Android APK rebuild is required: the Android app loads the live website. The existing APK and Cast sender are preserved.
