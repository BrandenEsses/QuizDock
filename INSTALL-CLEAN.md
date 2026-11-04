# Clean install / update

1. Upload `quizdock-v1.5-complete.zip` to `/opt/`.
2. Run `cd /opt && unzip -p quizdock-v1.5-complete.zip quizdock/install-v1.5.sh | bash -s -- --apk` to rebuild game + APK, or omit `--apk` to keep your existing working APK.
3. The script backs up `/opt/quizdock` and preserves `.env`, `downloads/`, and `.android-build-home/`. It verifies that the receiver on disk, inside Docker, and at the public HTTPS URL contains the v4 marker and no iframe. If the public verification fails, inspect Caddy routing / caching before testing the Chromecast.
4. Disconnect Cast completely and reconnect to test.

Never share output of `docker compose config` because it prints OPENAI_API_KEY. Rotate any previously exposed API key.
