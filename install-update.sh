#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt
[ -f quizdock-v0.9-beta.zip ] || { echo 'Missing /opt/quizdock-v0.9-beta.zip'; exit 1; }
[ -d quizdock ] || { echo 'Missing /opt/quizdock'; exit 1; }
cp -a quizdock "quizdock.backup.$(date +%Y%m%d-%H%M%S)"
python3 - <<'PY'
import zipfile, pathlib, shutil
root=pathlib.Path('/opt/quizdock').resolve()
with zipfile.ZipFile('/opt/quizdock-v0.9-beta.zip') as z:
 for item in z.infolist():
  parts=pathlib.PurePosixPath(item.filename).parts
  if parts and parts[0]=='quizdock': parts=parts[1:]
  if not parts: continue
  target=root.joinpath(*parts).resolve()
  if not target.is_relative_to(root): raise ValueError('Unsafe zip path')
  if item.is_dir(): target.mkdir(parents=True,exist_ok=True)
  else:
   target.parent.mkdir(parents=True,exist_ok=True)
   with z.open(item) as src, open(target,'wb') as dst: shutil.copyfileobj(src,dst)
PY
cd /opt/quizdock
docker compose up -d --build
docker compose ps
printf '\nAndroid source installed. See /opt/quizdock/BUILD-ANDROID.md for building APK.\n'
