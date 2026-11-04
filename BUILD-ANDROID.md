# QuizDock Android v0.9 beta

This package includes Android source, not a compiled APK. A functioning native Cast button requires your registered Google Cast **Custom Web Receiver** app ID and an Android build. Google Play Services must be installed on the device.

1. Open `android/` in Android Studio (JDK 17, Android SDK 35). Create `android/gradle.properties` containing `castAppId=YOUR_GOOGLE_CAST_RECEIVER_APP_ID`.
2. Build > Build APK(s) (debug APK for local testing).
3. Copy `android/app/build/outputs/apk/debug/app-debug.apk` to `downloads/quizdock.apk` on the server, then run `docker compose up -d --build`.
4. Download from `https://quizdock.ble.dev/downloads/quizdock.apk`. Android will request permission to install APKs from the browser. A debug APK is **not** a production-signed release; keep the same signing key for updates.

The Android app supports host, contestant and spectator interfaces through the shared web app. It sends the room code to the registered Cast receiver using the custom namespace. The Chromecast receiver must be published or the device registered for testing. Hardware casting and APK compilation have NOT been verified here. WebView state and Cast session behavior should be tested before distributing widely.

The web UI's desktop Cast button is not a replacement for the Android-native Cast button. Host authorization still depends on server socket and token behavior.
