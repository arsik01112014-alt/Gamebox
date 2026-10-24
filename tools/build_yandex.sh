#!/bin/sh
# Собирает ZIP для Яндекс Игр: веб-часть из assets + SDK Яндекса (/sdk.js) + tools/yandex/yandex.js.
# Использование: tools/build_yandex.sh <результат.zip>
set -eu
OUT=$(realpath -m "$1")
HERE=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cp -r "$HERE/assets/." "$WORK/"
rm -f "$WORK/privacy.html"
cp "$HERE/tools/yandex/yandex.js" "$WORK/js/yandex.js"
python3 - "$WORK/index.html" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
i = s.index('<script src=')  # перед первым скриптом: язык должен быть выставлен до загрузки переводов
s = s[:i] + '<script src="/sdk.js"></script>\n<script src="js/yandex.js"></script>\n' + s[i:]
open(p, 'w', encoding='utf-8').write(s)
PY
rm -f "$OUT"
cd "$WORK" && zip -q -r -X "$OUT" .
echo "built $OUT"
