# QuizDock v1.4 consolidated clean deployment

Includes v1.3 private host/player rejoin links, v1.2 human-only judging and manual buzzer control, v1.1 centered Android role picker, Android APK build service, native Cast sender with app ID CE3F2716, homepage APK download, and v4 direct-render Chromecast receiver (no iframe).

The installer replaces the application source as a coherent release, preserves existing .env, downloads/ and .android-build-home/, rebuilds only the game container by default, and verifies the receiver inside the running container and over public HTTPS. Use --apk to rebuild the Android APK too.

Active rooms are in memory and will be lost on server restart. The v4 receiver is not verified on physical Chromecast hardware.
