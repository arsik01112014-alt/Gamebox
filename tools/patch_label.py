#!/usr/bin/env python3
# Меняет строку в глобальной таблице строк resources.arsc на месте (например, название приложения).
# Новая строка должна быть той же длины, что и старая.
# Использование: patch_label.py <resources.arsc> <старая строка> <новая строка>
import struct, sys

path, old, new = sys.argv[1:4]
assert len(old) == len(new), 'длина новой строки должна совпадать со старой'
d = bytearray(open(path, 'rb').read())
pool = 12  # заголовок ResTable — 12 байт, за ним глобальная таблица строк
assert struct.unpack_from('<H', d, pool)[0] == 1, 'нет таблицы строк'
utf8 = bool(struct.unpack_from('<I', d, pool + 16)[0] & 0x100)
enc = (lambda x: x.encode('utf-8')) if utf8 else (lambda x: x.encode('utf-16-le'))
size = struct.unpack_from('<I', d, pool + 4)[0]
seg = bytes(d[pool:pool + size])
n = seg.count(enc(old))
assert n >= 1, 'строка не найдена'
d[pool:pool + size] = seg.replace(enc(old), enc(new))
open(path, 'wb').write(bytes(d))
print('название:', old, '->', new, '(%d)' % n)
