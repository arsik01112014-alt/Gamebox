import java.io.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.*;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;

// Добавляет блок подписи APK Signature Scheme v2 в уже подписанный v1 и выровненный APK.
// Использование: ApkV2Sign <вход.apk> <keystore.jks> <alias> <выход.apk>, пароль — в $KS_PASS.
// Блок вставляется перед центральным каталогом ZIP, смещение в EOCD обновляется.
public class ApkV2Sign {
    static final int SIG_RSA_PKCS1_SHA256 = 0x0103;
    static final int V2_ID = 0x7109871a;
    static final int CHUNK = 1 << 20;
    static final byte[] MAGIC = "APK Sig Block 42".getBytes(java.nio.charset.StandardCharsets.US_ASCII);

    public static void main(String[] a) throws Exception {
        byte[] in = Files.readAllBytes(Paths.get(a[0]));
        char[] pass = System.getenv("KS_PASS").toCharArray();
        KeyStore ks = KeyStore.getInstance(KeyStore.getDefaultType());
        try (InputStream is = new FileInputStream(a[1])) { ks.load(is, pass); }
        PrivateKey key = (PrivateKey) ks.getKey(a[2], pass);
        X509Certificate cert = (X509Certificate) ks.getCertificate(a[2]);

        int eocd = -1;
        for (int i = in.length - 22; i >= 0; i--) if (u32(in, i) == 0x06054b50L) { eocd = i; break; }
        int cdOff = (int) u32(in, eocd + 16);
        byte[] contents = slice(in, 0, cdOff);
        byte[] cd = slice(in, cdOff, eocd - cdOff);
        byte[] eocdOrig = slice(in, eocd, in.length - eocd);

        byte[] certDer = cert.getEncoded();
        byte[] pub = cert.getPublicKey().getEncoded();
        // по спецификации v2 хэш EOCD считается так, будто смещение центрального каталога
        // указывает на начало блока подписи, то есть на исходное cdOff
        byte[] top = topDigest(contents, cd, eocdOrig);
        byte[] signedData = signedData(top, certDer);
        Signature s = Signature.getInstance("SHA256withRSA");
        s.initSign(key); s.update(signedData);
        byte[] block = signingBlockFromSigned(signedData, s.sign(), pub);
        byte[] eocdP = eocdWithOffset(eocdOrig, cdOff + block.length);

        try (OutputStream out = new FileOutputStream(a[3])) {
            out.write(contents); out.write(block); out.write(cd); out.write(eocdP);
        }
        System.out.println("v2 добавлена: " + block.length + " байт");
    }

    static byte[] signingBlockFromSigned(byte[] signedData, byte[] sig, byte[] pub) {
        byte[] sigField = lp(cat(lp(cat(le32(SIG_RSA_PKCS1_SHA256), lp(sig)))));
        byte[] signer = cat(lp(signedData), sigField, lp(pub));
        byte[] value = lp(cat(lp(signer)));
        byte[] pair = cat(le64(4 + value.length), le32(V2_ID), value);
        long size = pair.length + 8 + MAGIC.length;
        return cat(le64(size), pair, le64(size), MAGIC);
    }

    static byte[] signedData(byte[] top, byte[] certDer) {
        byte[] digests = lp(cat(lp(cat(le32(SIG_RSA_PKCS1_SHA256), lp(top)))));
        byte[] certs = lp(cat(lp(certDer)));
        byte[] attrs = lp(new byte[0]);
        return cat(digests, certs, attrs);
    }

    static byte[] topDigest(byte[]... sections) throws Exception {
        List<byte[]> chunks = new ArrayList<>();
        for (byte[] sec : sections)
            for (int off = 0; off < sec.length; off += CHUNK) {
                int len = Math.min(CHUNK, sec.length - off);
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                md.update((byte) 0xa5); md.update(le32(len)); md.update(sec, off, len);
                chunks.add(md.digest());
            }
        MessageDigest top = MessageDigest.getInstance("SHA-256");
        top.update((byte) 0x5a); top.update(le32(chunks.size()));
        for (byte[] d : chunks) top.update(d);
        return top.digest();
    }

    static byte[] eocdWithOffset(byte[] eocd, int cdOffset) {
        byte[] r = eocd.clone();
        System.arraycopy(le32(cdOffset), 0, r, 16, 4);
        return r;
    }

    static long u32(byte[] b, int off) {
        return (b[off] & 0xffL) | (b[off + 1] & 0xffL) << 8 | (b[off + 2] & 0xffL) << 16 | (b[off + 3] & 0xffL) << 24;
    }
    static byte[] slice(byte[] b, int off, int len) { byte[] r = new byte[len]; System.arraycopy(b, off, r, 0, len); return r; }
    static byte[] le32(int v) { return ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(v).array(); }
    static byte[] le64(long v) { return ByteBuffer.allocate(8).order(ByteOrder.LITTLE_ENDIAN).putLong(v).array(); }
    static byte[] lp(byte[] d) { return cat(le32(d.length), d); }
    static byte[] cat(byte[]... parts) {
        int n = 0; for (byte[] p : parts) n += p.length;
        byte[] r = new byte[n]; int o = 0;
        for (byte[] p : parts) { System.arraycopy(p, 0, r, o, p.length); o += p.length; }
        return r;
    }
}
