# QuizDock v1.0 combined deployment (beta)

This bundle combines the v0.9 game server and Android project with a Docker Compose Android builder. Cast application ID: `CE3F2716`.

Upload `quizdock-v1.0-bundle.zip` to `/opt` on dc0 and run:

```bash
cd /opt && unzip -p quizdock-v1.0-bundle.zip quizdock/install-bundle.sh | bash
```

The command backs up the existing installation, preserves `.env`, builds a **debug-signed** APK using the Android SDK and Gradle in Docker, publishes it at `/downloads/quizdock.apk`, and rebuilds the game server. First build needs internet and may take several minutes. Docker Compose profile `build-apk` isolates the builder from normal `docker compose up -d`.

For subsequent APK rebuilds:

```bash
cd /opt/quizdock && docker compose --profile build-apk run --rm --build --no-deps apk-builder
```

APK signing data is retained in `.android-build-home` on the server. Back this directory up securely if you want future APKs to update existing installs. Debug APKs are not suitable for public production distribution.

This package is **not confirmed compiled or device-tested**. Native Cast requires working Google Cast receiver registration and network discovery. Active rooms remain in memory and are lost on server restart.
