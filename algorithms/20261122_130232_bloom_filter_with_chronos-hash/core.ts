/**
 * Bloom Filter implementation using Chronos-Hash based hash functions.
 * Pure TypeScript, no external dependencies.
 */
export class BloomFilter<T> {
    private readonly bitArray: Uint8Array;
    private readonly size: number;          // number of bits (m)
    private readonly hashCount: number;     // number of hash functions (k)
    private readonly seeds: number[];       // distinct seeds for each hash

    /**
     * @param expectedElements Approximate number of elements to be stored (n)
     * @param falsePositiveRate Desired false positive probability (p), 0 < p < 1
     */
    constructor(expectedElements: number, falsePositiveRate: number) {
        if (expectedElements <= 0) {
            throw new Error('expectedElements must be > 0');
        }
        if (falsePositiveRate <= 0 || falsePositiveRate >= 1) {
            throw new Error('falsePositiveRate must be between 0 and 1 (exclusive)');
        }

        // Optimal size m = - (n * ln p) / (ln 2)^2
        const ln2 = Math.log(2);
        const m = Math.ceil(-(expectedElements * Math.log(falsePositiveRate)) / (ln2 * ln2));
        this.size = m;

        // Optimal number of hash functions k = (m / n) * ln 2
        const k = Math.round((m / expectedElements) * ln2);
        this.hashCount = Math.max(1, k);

        // Allocate bit array (rounded up to whole bytes)
        const byteSize = Math.ceil(this.size / 8);
        this.bitArray = new Uint8Array(byteSize);

        // Generate deterministic seeds (first k odd numbers)
        this.seeds = Array.from({ length: this.hashCount }, (_, i) => 0x5bd1e995 * (i + 1) | 0);
    }

    /** Add an element to the filter */
    add(item: T): void {
        const hashes = this.computeHashes(item);
        for (const h of hashes) {
            const idx = h % this.size;
            this.setBit(idx);
        }
    }

    /** Test whether an element is possibly in the filter */
    contains(item: T): boolean {
        const hashes = this.computeHashes(item);
        for (const h of hashes) {
            const idx = h % this.size;
            if (!this.getBit(idx)) {
                return false;
            }
        }
        return true;
    }

    /** Reset the filter to empty state */
    clear(): void {
        this.bitArray.fill(0);
    }

    /** Internal: compute k hash values for a given item */
    private computeHashes(item: T): number[] {
        const str = this.toString(item);
        const result: number[] = [];
        for (let i = 0; i < this.hashCount; i++) {
            result.push(chronosHash(str, this.seeds[i]));
        }
        return result;
    }

    /** Convert any supported type to string */
    private toString(item: T): string {
        if (typeof item === 'string') return item;
        if (typeof item === 'number' || typeof item === 'bigint') return item.toString();
        if (typeof item === 'boolean') return item ? '1' : '0';
        // For objects/arrays, JSON.stringify provides deterministic representation
        return JSON.stringify(item);
    }

    /** Set bit at position idx */
    private setBit(idx: number): void {
        const byteIdx = idx >>> 3;          // divide by 8
        const bitMask = 1 << (idx & 7);     // modulo 8
        this.bitArray[byteIdx] |= bitMask;
    }

    /** Get bit at position idx */
    private getBit(idx: number): boolean {
        const byteIdx = idx >>> 3;
        const bitMask = 1 << (idx & 7);
        return (this.bitArray[byteIdx] & bitMask) !== 0;
    }
}

/**
 * Chronos-Hash: a deterministic, seed‑aware 32‑bit hash.
 * Based on FNV‑1a with additional avalanche steps.
 */
function chronosHash(str: string, seed: number): number {
    // FNV‑1a offset basis XOR seed
    let h = 0x811c9dc5 ^ (seed >>> 0);
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
        h >>>= 0; // force unsigned 32‑bit
    }
    // Avalanche mixing
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
    return h >>> 0;
}
