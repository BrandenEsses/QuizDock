#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt
ZIP=/opt/quizdock-v1.2-bundle.zip
[ -f "$ZIP" ] || { echo "Missing $ZIP"; exit 1; }
if [ -d /opt/quizdock ]; then cp -a /opt/quizdock "/opt/quizdock.backup.$(date +%Y%m%d-%H%M%S)"; fi
python3 - "$ZIP" <<'PYINNER'
import pathlib,sys,zipfile,shutil
root=pathlib.Path('/opt/quizdock').resolve()
with zipfile.ZipFile(sys.argv[1]) as z:
 for i in z.infolist():
  parts=pathlib.PurePosixPath(i.filename).parts
  if not parts or parts[0]!='quizdock' or i.is_dir():continue
  rel=parts[1:]
  if not rel or rel[0] in ('.env','downloads','.android-build-home'):continue
  out=root.joinpath(*rel).resolve()
  if not out.is_relative_to(root):raise ValueError('Unsafe path')
  out.parent.mkdir(parents=True,exist_ok=True)
  with z.open(i) as a,open(out,'wb') as b:shutil.copyfileobj(a,b)
PYINNER
cd /opt/quizdock
mkdir -p downloads .android-build-home
[ -f .env ] || { cp .env.example .env; chmod 600 .env; }
docker compose --profile build-apk run --rm --build --no-deps apk-builder
[ -s downloads/quizdock.apk ] || { echo 'APK missing after build'; exit 1; }
docker compose up -d --build quizdock
printf '\nAPK ready: https://quizdock.ble.dev/downloads/quizdock.apk\n'
