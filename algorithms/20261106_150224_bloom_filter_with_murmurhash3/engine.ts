import { BloomFilterOptions, assert } from "./types";

/**
 * MurmurHash3 (x86, 32-bit) implementation.
 * Returns a 32‑bit unsigned integer.
 * Reference: https://github.com/aappleby/smhasher/blob/master/src/MurmurHash3.cpp
 */
export function murmurhash3_32(key: string, seed: number = 0): number {
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;

    let h1 = seed >>> 0;
    const bytes = new TextEncoder().encode(key);
    const len = bytes.length;
    const blockCount = Math.floor(len / 4);

    // Body - process 4-byte blocks
    for (let i = 0; i < blockCount; i++) {
        const i4 = i * 4;
        // Little‑endian load order
        let k1 =
            (bytes[i4] & 0xff) |
            ((bytes[i4 + 1] & 0xff) << 8) |
            ((bytes[i4 + 2] & 0xff) << 16) |
            ((bytes[i4 + 3] & 0xff) << 24);

        k1 = Math.imul(k1, c1);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = Math.imul(k1, c2);

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1 = Math.imul(h1, 5) + 0xe6546b64;
    }

    // Tail - remaining 1-3 bytes
    let k1 = 0;
    const tailIndex = blockCount * 4;
    const tailSize = len & 3;
    if (tailSize === 3) {
        k1 ^= (bytes[tailIndex + 2] & 0xff) << 16;
    }
    if (tailSize >= 2) {
        k1 ^= (bytes[tailIndex + 1] & 0xff) << 8;
    }
    if (tailSize >= 1) {
        k1 ^= bytes[tailIndex] & 0xff;
        k1 = Math.imul(k1, c1);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = Math.imul(k1, c2);
        h1 ^= k1;
    }

    // Finalization
    h1 ^= len;
    // fmix32
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;

    // Convert to unsigned 32‑bit integer
    return h1 >>> 0;
}

/**
 * Bloom filter implementation using a bit array and multiple MurmurHash3 hash functions.
 */
export class BloomFilter {
    private readonly size: number; // number of bits
    private readonly hashCount: number;
    private readonly seeds: number[];
    private readonly bits: Uint8Array; // packed bits

    /**
     * Construct a Bloom filter.
     * @param options Configuration options.
     */
    constructor(options: BloomFilterOptions) {
        assert(options.size > 0, "Bloom filter size must be > 0");
        assert(options.hashCount > 0, "Bloom filter hashCount must be > 0");
        this.size = options.size;
        this.hashCount = options.hashCount;
        this.seeds = options.seeds && options.seeds.length >= options.hashCount
            ? options.seeds.slice(0, options.hashCount)
            : Array.from({ length: options.hashCount }, (_, i) => i);
        this.bits = new Uint8Array(Math.ceil(this.size / 8));
    }

    /** Compute the i‑th hash for a given key, mapped into the bit array range. */
    private hash(key: string, i: number): number {
        const raw = murmurhash3_32(key, this.seeds[i]);
        // Modulo size using bitwise AND when size is power‑of‑two could be faster,
        // but we keep generic modulo for correctness.
        return raw % this.size;
    }

    /** Set the bit at position `pos`. */
    private setBit(pos: number): void {
        const byteIdx = Math.floor(pos / 8);
        const bitMask = 1 << (pos % 8);
        this.bits[byteIdx] |= bitMask;
    }

    /** Test whether the bit at position `pos` is set. */
    private getBit(pos: number): boolean {
        const byteIdx = Math.floor(pos / 8);
        const bitMask = 1 << (pos % 8);
        return (this.bits[byteIdx] & bitMask) !== 0;
    }

    /** Add an element to the filter. */
    add(element: string): void {
        for (let i = 0; i < this.hashCount; i++) {
            const pos = this.hash(element, i);
            this.setBit(pos);
        }
    }

    /** Test whether an element is possibly in the set. */
    contains(element: string): boolean {
        for (let i = 0; i < this.hashCount; i++) {
            const pos = this.hash(element, i);
            if (!this.getBit(pos)) {
                return false;
            }
        }
        return true;
    }

    /** Return the raw bit array (useful for debugging). */
    getBitArray(): Uint8Array {
        return this.bits;
    }

    /** Approximate false‑positive probability given current number of inserted items `n`. */
    static falsePositiveRate(m: number, k: number, n: number): number {
        // (1 - e^(-k * n / m))^k
        const exponent = -k * n / m;
        const prob = Math.pow(1 - Math.exp(exponent), k);
        return prob;
    }

    /** Compute optimal bit array size (in bits) for expected insertions `n` and target false‑positive rate `p`. */
    static optimalSize(n: number, p: number): number {
        assert(n > 0, "Expected number of items must be > 0");
        assert(p > 0 && p < 1, "False‑positive rate must be between 0 and 1");
        const m = - (n * Math.log(p)) / (Math.LN2 ** 2);
        return Math.ceil(m);
    }

    /** Compute optimal number of hash functions for size `m` (bits) and expected insertions `n`. */
    static optimalHashCount(m: number, n: number): number {
        assert(m > 0 && n > 0, "Size and expected items must be > 0");
        const k = (m / n) * Math.LN2;
        return Math.max(1, Math.round(k));
    }
}
