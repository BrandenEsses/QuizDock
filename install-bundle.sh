#!/usr/bin/env bash
set -Eeuo pipefail
[[ $(id -u) -eq 0 ]] || { echo "Run as root"; exit 1; }
ZIP=/opt/quizdock-v1.0-bundle.zip
DEST=/opt/quizdock
[[ -f "$ZIP" ]] || { echo "Missing $ZIP"; exit 1; }
command -v docker >/dev/null || { echo "Docker is required"; exit 1; }
command -v python3 >/dev/null || { echo "Python 3 is required"; exit 1; }
if [[ -d "$DEST" ]]; then
  BACKUP="/opt/quizdock.backup.$(date +%Y%m%d-%H%M%S)"
  cp -a "$DEST" "$BACKUP"
  echo "Backup: $BACKUP"
fi
python3 - "$ZIP" "$DEST" <<'PYINNER'
import pathlib,shutil,sys,zipfile,stat
archive,destination=sys.argv[1:]; root=pathlib.Path(destination).resolve()
with zipfile.ZipFile(archive) as z:
 for entry in z.infolist():
  parts=pathlib.PurePosixPath(entry.filename).parts
  if parts and parts[0]=='quizdock': parts=parts[1:]
  if not parts:continue
  if entry.is_dir():continue
  if (entry.external_attr >> 16) & 0o170000 == stat.S_IFLNK:raise RuntimeError('Symlink in archive')
  target=root.joinpath(*parts).resolve()
  if not target.is_relative_to(root):raise RuntimeError('Unsafe path')
  target.parent.mkdir(parents=True,exist_ok=True)
  with z.open(entry) as inp,open(target,'wb') as out:shutil.copyfileobj(inp,out)
PYINNER
cd "$DEST"
if [[ ! -f .env ]]; then
  cp .env.example .env
  chmod 600 .env
  echo 'Created .env; set OPENAI_API_KEY in /opt/quizdock/.env to enable AI.'
fi
mkdir -p downloads .android-build-home
chmod 700 .android-build-home
# Preserve the Android debug signing key across rebuilds.
docker compose --profile build-apk build apk-builder
docker compose --profile build-apk run --rm --no-deps apk-builder
test -s downloads/quizdock.apk
docker compose up -d --build quizdock
printf '\nAPK: https://quizdock.ble.dev/downloads/quizdock.apk\n'
docker compose ps
