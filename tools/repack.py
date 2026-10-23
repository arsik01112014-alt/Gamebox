#!/usr/bin/env python3
# Пересобирает APK: состав, порядок и сжатие записей исходного APK сохраняются.
# Меняются только файлы assets/ (берутся из папки) и AndroidManifest.xml (если передан).
# META-INF не копируется: подпись ставит build_apk.sh. Записей-каталогов нет.
# Использование: repack.py <исходный.apk> <папка assets> <выход.apk> [AndroidManifest.xml]
import os, sys, zipfile

base, assets_dir, out = sys.argv[1:4]
manifest = sys.argv[4] if len(sys.argv) > 4 else None
with zipfile.ZipFile(base) as zin, zipfile.ZipFile(out, 'w') as zout:
    names = set()
    for info in zin.infolist():
        n = info.filename
        if n.startswith('META-INF/') or n.endswith('/'):
            continue
        if n.startswith('assets/') and os.path.isfile(os.path.join(assets_dir, n[len('assets/'):])):
            data = open(os.path.join(assets_dir, n[len('assets/'):]), 'rb').read()
        elif n == 'AndroidManifest.xml' and manifest:
            data = open(manifest, 'rb').read()
        else:
            data = zin.read(info)
        zi = zipfile.ZipInfo(n, info.date_time)
        zi.compress_type = info.compress_type
        zi.external_attr = info.external_attr
        zout.writestr(zi, data)
        names.add(n)
    for root, _, files in os.walk(assets_dir):
        for f in sorted(files):
            rel = 'assets/' + os.path.relpath(os.path.join(root, f), assets_dir)
            if rel in names:
                continue
            zi = zipfile.ZipInfo(rel, (2026, 10, 20, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            zout.writestr(zi, open(os.path.join(root, f), 'rb').read())
