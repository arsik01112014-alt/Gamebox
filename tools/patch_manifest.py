#!/usr/bin/env python3
# Меняет package, versionName, versionCode и полное имя активности в бинарном AndroidManifest.xml.
# Таблица строк AXML пересобирается, поэтому строки могут менять длину.
# Имя активности переписывается полным: относительное «.MainActivity» привязано к package и после смены пакета не находит класс.
# Использование: patch_manifest.py <AndroidManifest.xml> <package> <versionName> <versionCode>
import struct, sys

ACTIVITY = 'com.arcade.minigames.MainActivity'

def parse(d):
    # заголовок таблицы строк: тип(2) размер заголовка(2) размер(4) число строк(4) число стилей(4) флаги(4) начало строк(4) начало стилей(4)
    assert d[:4] == b'\x03\x00\x08\x00', 'не AXML'
    pool = 8
    assert struct.unpack_from('<H', d, pool)[0] == 1, 'нет таблицы строк'
    hdr = struct.unpack_from('<H', d, pool + 2)[0]
    count = struct.unpack_from('<I', d, pool + 8)[0]
    assert struct.unpack_from('<I', d, pool + 12)[0] == 0, 'стили не поддерживаются'
    flags = struct.unpack_from('<I', d, pool + 16)[0]
    start = pool + struct.unpack_from('<I', d, pool + 20)[0]
    offs = [struct.unpack_from('<I', d, pool + hdr + 4 * i)[0] for i in range(count)]
    utf8 = bool(flags & 0x100)
    out = []
    for o in offs:
        p = start + o
        if utf8:
            cl = d[p]; p += 1
            if cl & 0x80: p += 1
            bl = d[p]; p += 1
            out.append(d[p:p + bl].decode('utf-8'))
        else:
            cl = struct.unpack_from('<H', d, p)[0]; p += 2
            if cl & 0x8000: cl = ((cl & 0x7fff) << 16) | struct.unpack_from('<H', d, p)[0]; p += 2
            out.append(d[p:p + cl * 2].decode('utf-16-le'))
    return out, utf8, pool + struct.unpack_from('<I', d, pool + 4)[0]

def encode(s, utf8):
    if utf8:
        b = s.encode('utf-8')
        return bytes([len(s)]) + bytes([len(b)]) + b + b'\x00'
    return struct.pack('<H', len(s)) + s.encode('utf-16-le') + b'\x00\x00'

def rebuild(d, repl):
    strings, utf8, pool_end = parse(d)
    flags = struct.unpack_from('<I', d, 8 + 16)[0]
    new = [repl.get(s, s) for s in strings]
    offs, data = [], b''
    for s in new:
        offs.append(len(data)); data += encode(s, utf8)
    data += b'\x00' * (-len(data) % 4)
    head = 28 + 4 * len(new)
    body = struct.pack('<HHIIIIII', 1, 28, 0, len(new), 0, flags, head, 0)
    body += b''.join(struct.pack('<I', o) for o in offs) + data
    chunk = bytearray(body)
    struct.pack_into('<I', chunk, 4, len(chunk))
    out = bytearray(d[:8]) + chunk + d[pool_end:]
    struct.pack_into('<I', out, 4, len(out))
    return out

def set_version_code(d, code):
    strings, _, _ = parse(d)
    vc = strings.index('versionCode')
    pos = 8 + struct.unpack_from('<I', d, 12)[0]
    while pos < len(d):
        typ, hsz, size = struct.unpack_from('<HHI', d, pos)
        if typ == 0x0102:
            ext = pos + 16
            astart, asize, acount = struct.unpack_from('<HHH', d, ext + 8)
            for k in range(acount):
                a = ext + astart + k * asize
                if struct.unpack_from('<I', d, a + 4)[0] == vc:
                    assert d[a + 15] == 0x10, 'versionCode не целое'
                    struct.pack_into('<I', d, a + 16, code)
                    return
        pos += size
    raise SystemExit('versionCode не найден')

def main():
    path, pkg, vname, vcode = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
    d = open(path, 'rb').read()
    strings, _, _ = parse(d)
    for old in ('com.arcade.minigames', '2.9', '.MainActivity'):
        assert strings.count(old) == 1, f'строка «{old}» встречается {strings.count(old)} раз'
    d = rebuild(d, {'com.arcade.minigames': pkg, '2.9': vname, '.MainActivity': ACTIVITY})
    set_version_code(d, vcode)
    open(path, 'wb').write(bytes(d))
    print('манифест:', pkg, vname, vcode)

main()
