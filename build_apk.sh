#!/bin/sh
# Собирает GameBox APK. Состав записей исходного APK сохраняется (tools/repack.py).
# Подпись: jarsigner (v1), затем выравнивание zipalign.py, затем подпись v2 (tools/ApkV2Sign.java).
# Новый пакет (ставится рядом со старым): APP_PKG=com.arcade.minigame3 APP_VNAME=3.0 APP_VCODE=19
# Админка: ASSETS_DIR=admin ASSETS_EXCLUSIVE=1 APP_LABEL=GBAdmin APP_PKG=com.arcade.gbadmin APP_VNAME=1.0 APP_VCODE=1
# Использование: KS_PASS=... [APP_PKG=...] build_apk.sh <исходный.apk> <результат.apk> <keystore.jks> <alias>
set -eu
BASE=$(realpath "$1"); OUT=$(realpath -m "$2"); KS=$(realpath "$3"); ALIAS=$4
HERE=$(cd "$(dirname "$0")" && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
MANIFEST=""
if [ -n "${APP_PKG:-}" ]; then
  unzip -q "$BASE" AndroidManifest.xml -d "$WORK"
  python3 "$HERE/tools/patch_manifest.py" "$WORK/AndroidManifest.xml" "$APP_PKG" "$APP_VNAME" "$APP_VCODE"
  MANIFEST="$WORK/AndroidManifest.xml"
fi
if [ -n "${APP_LABEL:-}" ]; then
  unzip -q "$BASE" resources.arsc -d "$WORK"
  python3 "$HERE/tools/patch_label.py" "$WORK/resources.arsc" GameBox "$APP_LABEL"
  export RESOURCES_ARSC="$WORK/resources.arsc"
fi
python3 "$HERE/tools/repack.py" "$BASE" "${ASSETS_DIR:-$HERE/assets}" "$WORK/unsigned.apk" $MANIFEST
cp "$WORK/unsigned.apk" "$OUT"
jarsigner -keystore "$KS" -storepass:env KS_PASS -sigalg SHA256withRSA -digestalg SHA-256 "$OUT" "$ALIAS" >/dev/null
python3 "$HERE/zipalign.py" "$OUT"
WORK_JAVA=$(mktemp -d)
javac -d "$WORK_JAVA" "$HERE/tools/ApkV2Sign.java"
mv "$OUT" "$OUT.v1"
KS_PASS="$KS_PASS" java -cp "$WORK_JAVA" ApkV2Sign "$OUT.v1" "$KS" "$ALIAS" "$OUT"
rm -rf "$WORK_JAVA" "$OUT.v1"
echo "built $OUT"
