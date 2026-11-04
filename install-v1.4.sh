#!/usr/bin/env bash
set -Eeuo pipefail
ZIP=/opt/quizdock-v1.4-complete.zip
TARGET=/opt/quizdock
BUILD_APK=0
if [[ "${1:-}" == '--apk' ]]; then BUILD_APK=1; fi
[[ -s "$ZIP" ]] || { echo "ERROR: Missing $ZIP" >&2; exit 1; }
command -v docker >/dev/null || { echo 'ERROR: Docker missing' >&2; exit 1; }
command -v python3 >/dev/null || { echo 'ERROR: Python 3 missing' >&2; exit 1; }
mkdir -p /opt
STAGING=$(mktemp -d /opt/.quizdock-stage.XXXXXXXX)
trap 'rm -rf "$STAGING"' EXIT
python3 - "$ZIP" "$STAGING" <<'PYINNER'
import sys,zipfile,pathlib,shutil
archive=pathlib.Path(sys.argv[1]); dst=pathlib.Path(sys.argv[2]);
with zipfile.ZipFile(archive) as z:
 for entry in z.infolist():
  parts=pathlib.PurePosixPath(entry.filename).parts
  if not parts or parts[0]!='quizdock' or entry.is_dir(): continue
  rel=parts[1:]
  if not rel or any(part in ('..','') for part in rel): raise ValueError('Unsafe archive entry')
  if rel[0] in ('.env','downloads','.android-build-home'): continue
  out=dst.joinpath(*rel)
  out.parent.mkdir(parents=True,exist_ok=True)
  with z.open(entry) as src, open(out,'wb') as target:shutil.copyfileobj(src,target)
PYINNER
[[ -s "$STAGING/public/cast-receiver.html" ]] || { echo 'ERROR: Missing receiver in archive' >&2; exit 1; }
grep -q 'QuizDock Cast TV' "$STAGING/public/cast-receiver.html" || { echo 'ERROR: Wrong receiver in archive' >&2; exit 1; }
if grep -qi '<iframe' "$STAGING/public/cast-receiver.html"; then echo 'ERROR: Old iframe receiver in archive' >&2; exit 1; fi
node_check=0
if command -v node >/dev/null; then node --check "$STAGING/server.js" || exit 1; node_check=1; fi
if [[ -d "$TARGET" ]]; then
 BACKUP="/opt/quizdock.backup.$(date +%Y%m%d-%H%M%S)"
 echo "Backing up existing QuizDock to $BACKUP"
 cp -a "$TARGET" "$BACKUP"
else
 mkdir -p "$TARGET"
fi
# Install release files, preserving runtime config, signing state and APK.
cp -a "$STAGING/." "$TARGET/"
chmod +x "$TARGET/install-v1.4.sh"
mkdir -p "$TARGET/downloads"
cd "$TARGET"
echo 'Building QuizDock game server...'
docker compose up -d --build --force-recreate quizdock
if [[ "$BUILD_APK" -eq 1 ]]; then
 echo 'Building Android APK (first build can take several minutes)...'
 docker compose --profile build-apk run --rm --build --no-deps apk-builder
 [[ -s downloads/quizdock.apk ]] || { echo 'ERROR: APK build did not produce downloads/quizdock.apk' >&2; exit 1; }
fi
echo 'Verifying v4 receiver on disk and in the running container...'
grep -q 'QuizDock Cast TV' public/cast-receiver.html
docker compose exec -T quizdock sh -c 'grep -q "QuizDock Cast TV" public/cast-receiver.html && ! grep -qi "<iframe" public/cast-receiver.html' || { echo 'ERROR: Container is not running v4 receiver' >&2; exit 1; }
TMP=$(mktemp)
trap 'rm -rf "$STAGING"; rm -f "$TMP"' EXIT
if curl --fail --silent --show-error --max-time 20 "https://quizdock.ble.dev/cast-receiver?verify=$(date +%s)" -o "$TMP"; then
 if grep -q 'QuizDock Cast TV' "$TMP" && ! grep -qi '<iframe' "$TMP"; then
  echo 'SUCCESS: Public HTTPS receiver is v4 (no iframe).'
 else
  echo 'WARNING: Public HTTPS still serves a different receiver; check Caddy/upstream/cache.' >&2
  exit 2
 fi
else
 echo 'WARNING: Could not verify public HTTPS endpoint. Check DNS/Caddy separately.' >&2
 exit 2
fi
if [[ -s downloads/quizdock.apk ]]; then echo 'Android APK available at https://quizdock.ble.dev/downloads/quizdock.apk'; fi
echo 'QuizDock v1.4 deployed. Disconnect and reconnect Chromecast before testing.'
