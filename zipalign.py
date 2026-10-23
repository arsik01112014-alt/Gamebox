#!/usr/bin/env python3
# Выравнивает несжатые записи APK по 4 байтам (Android требует для targetSdk >= 30).
# Запускать ПОСЛЕ подписи: jarsigner перепаковывает архив и сбивает выравнивание, v1-подпись от этого не ломается.
import struct, sys, zipfile, os

src = sys.argv[1]
tmp = src + '.aligned'
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, 'w') as zout:
    for info in zin.infolist():
        data = zin.read(info)
        new = zipfile.ZipInfo(info.filename, info.date_time)
        new.compress_type = info.compress_type
        new.external_attr = info.external_attr
        if info.compress_type == zipfile.ZIP_STORED:
            data_start = zout.fp.tell() + 30 + len(info.filename.encode('utf-8'))
            pad = (4 - data_start % 4) % 4
            if 0 < pad < 4:
                pad += 4  # поле extra короче 4 байт не разбирается, добавляем заголовок целиком
            if pad:
                new.extra = b'\xd9\x35' + struct.pack('<H', pad - 4) + b'\0' * (pad - 4)
        zout.writestr(new, data)
os.replace(tmp, src)

# проверка: данные каждой несжатой записи начинаются на границе 4 байт
with zipfile.ZipFile(src) as z, open(src, 'rb') as f:
    bad = []
    for info in z.infolist():
        f.seek(info.header_offset + 26)
        nlen, elen = struct.unpack('<HH', f.read(4))
        if info.compress_type == zipfile.ZIP_STORED and (info.header_offset + 30 + nlen + elen) % 4:
            bad.append(info.filename)
    if bad:
        sys.exit('не выровнено: ' + ', '.join(bad))
print('выравнивание ok:', len(z.infolist()), 'записей')
