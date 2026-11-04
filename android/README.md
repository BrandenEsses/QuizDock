# QuizDock Android source (prototype)
This is Android Studio source, **not a compiled APK**. It embeds the existing web UI for host, contestant, and spectator. A native Cast route button is present, but **room handoff to the custom receiver is not implemented** and must be completed before casting works. It is not a finished Android release.

Open the folder in Android Studio, install Android SDK 35, and set `castAppId=YOUR_REGISTERED_RECEIVER_ID` in `gradle.properties` (do not use the sample/default receiver ID for QuizDock). Build > Build APK(s).

Do not publish the APK until Cast room messaging, session lifecycle, and WebView security have been tested on hardware. The website currently supports spectators through `/display/ROOMCODE`; a role picker is not yet built into this Android wrapper.
