/**
 * 极简 MD5（RFC 1321），给网盘上报文件摘要用。
 *
 * 浏览器没有内置 MD5（crypto.subtle 只支持 SHA），服务端的 /files 接口又需要 md5，
 * 所以这里按标准算法实现一份：输入 Uint8Array（或 ArrayBuffer），输出 32 位小写十六进制。
 */

// 每轮的循环左移位数
const SHIFTS = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

// K[i] = floor(abs(sin(i + 1)) * 2^32)
const K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
}

function rotl(x, c) {
    return ((x << c) | (x >>> (32 - c))) >>> 0;
}

function wordToHexLE(word) {
    let out = '';
    for (let i = 0; i < 4; i++) {
        const byte = (word >>> (i * 8)) & 0xff;
        out += (byte < 16 ? '0' : '') + byte.toString(16);
    }
    return out;
}

/**
 * @param {Uint8Array|ArrayBuffer} input
 * @returns {string} 32 位小写十六进制
 */
export function md5Hex(input) {
    let bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const len = bytes.length;
    const bitLen = len * 8;

    // 补位：0x80 + 若干 0，使总长度为 64 的倍数且末尾留 8 字节长度
    const padded = new Uint8Array((((len + 8) >> 6) + 1) * 64);
    padded.set(bytes);
    padded[len] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, bitLen >>> 0, true);
    view.setUint32(padded.length - 4, Math.floor(bitLen / 4294967296) >>> 0, true);

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    const m = new Uint32Array(16);
    for (let offset = 0; offset < padded.length; offset += 64) {
        for (let i = 0; i < 16; i++) {
            m[i] = view.getUint32(offset + i * 4, true);
        }
        let a = a0;
        let b = b0;
        let c = c0;
        let d = d0;
        for (let i = 0; i < 64; i++) {
            let f;
            let g;
            if (i < 16) {
                f = (b & c) | (~b & d);
                g = i;
            } else if (i < 32) {
                f = (d & b) | (~d & c);
                g = (5 * i + 1) % 16;
            } else if (i < 48) {
                f = b ^ c ^ d;
                g = (3 * i + 5) % 16;
            } else {
                f = c ^ (b | ~d);
                g = (7 * i) % 16;
            }
            // 四项相加最大不到 2^53，先当普通整数加再用 >>>0 取模 2^32，结果精确
            const sum = f + a + K[i] + m[g];
            a = d;
            d = c;
            c = b;
            b = (b + rotl(sum >>> 0, SHIFTS[i])) >>> 0;
        }
        a0 = (a0 + a) >>> 0;
        b0 = (b0 + b) >>> 0;
        c0 = (c0 + c) >>> 0;
        d0 = (d0 + d) >>> 0;
    }

    return wordToHexLE(a0) + wordToHexLE(b0) + wordToHexLE(c0) + wordToHexLE(d0);
}

export default md5Hex;
