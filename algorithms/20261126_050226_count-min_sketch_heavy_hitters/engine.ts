import { CountMinSketchParams, HeavyHitter } from "./types";

/**
 * Deterministic universal hash generator.
 * For a given seed, returns a function h(x) = ((a * hashCode(x) + b) mod PRIME) mod mod.
 */
class HashFunction {
    private readonly a: number;
    private readonly b: number;
    private readonly mod: number;
    private static readonly PRIME = 4294967311; // a 32‑bit prime > 2^32

    constructor(seed: number, mod: number) {
        // Simple linear congruential generator to derive a and b from seed
        const rng = (s: number) => {
            const m = 0x100000000; // 2^32
            const a = 1664525;
            const c = 1013904223;
            return (a * s + c) % m;
        };
        this.a = (rng(seed) % (HashFunction.PRIME - 1)) + 1; // a ∈ [1, PRIME-1]
        this.b = rng(seed + 1) % HashFunction.PRIME;        // b ∈ [0, PRIME-1]
        this.mod = mod;
    }

    /** Simple string → 32‑bit integer hash (FNV‑1a). */
    private static fnv1a(str: string): number {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        // Ensure unsigned 32‑bit integer
        return hash >>> 0;
    }

    public hash(item: string): number {
        const x = HashFunction.fnv1a(item);
        const h = (HashFunction.PRIME + ((this.a * x + this.b) % HashFunction.PRIME)) % HashFunction.PRIME;
        return h % this.mod;
    }
}

/**
 * Count‑Min Sketch with optional heavy‑hitter extraction.
 * The implementation is pure, deterministic and fully typed.
 */
export class CountMinSketch {
    private readonly width: number;
    private readonly depth: number;
    private readonly table: Uint32Array[]; // depth rows, each width columns
    private readonly hashFunctions: HashFunction[];
    private totalCount: number = 0;

    /** Optional auxiliary map to enable heavy‑hitter queries without external bookkeeping. */
    private readonly observed: Map<string, number>;

    constructor(params: CountMinSketchParams) {
        if (!Number.isInteger(params.width) || params.width <= 0) {
            throw new Error("width must be a positive integer");
        }
        if (!Number.isInteger(params.depth) || params.depth <= 0) {
            throw new Error("depth must be a positive integer");
        }
        this.width = params.width;
        this.depth = params.depth;
        this.table = Array.from({ length: this.depth }, () => new Uint32Array(this.width));
        this.hashFunctions = Array.from({ length: this.depth }, (_, i) => new HashFunction(i + 12345, this.width));
        this.observed = new Map<string, number>();
    }

    /**
     * Increment the count of `item` by `increment` (default 1).
     * Throws if `increment` is negative or not an integer.
     */
    public update(item: string, increment: number = 1): void {
        if (!Number.isInteger(increment) || increment < 0) {
            throw new Error("increment must be a non‑negative integer");
        }
        if (increment === 0) {
            return;
        }
        for (let i = 0; i < this.depth; i++) {
            const col = this.hashFunctions[i].hash(item);
            this.table[i][col] = this.table[i][col] + increment;
        }
        this.totalCount += increment;
        // Keep auxiliary exact count for heavy‑hitter extraction.
        const prev = this.observed.get(item) ?? 0;
        this.observed.set(item, prev + increment);
    }

    /**
     * Estimate the frequency of `item`. The returned value is an upper bound
     * on the true frequency, with error at most `totalCount / width`.
     */
    public estimate(item: string): number {
        let min = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < this.depth; i++) {
            const col = this.hashFunctions[i].hash(item);
            const val = this.table[i][col];
            if (val < min) {
                min = val;
            }
        }
        return min;
    }

    /** Return all items whose estimated frequency is ≥ `threshold`. */
    public heavyHitters(threshold: number): HeavyHitter[] {
        if (threshold < 0) {
            throw new Error("threshold must be non‑negative");
        }
        const result: HeavyHitter[] = [];
        for (const [item] of this.observed) {
            const est = this.estimate(item);
            if (est >= threshold) {
                result.push({ item, estimate: est });
            }
        }
        // Sort descending by estimate for deterministic output
        result.sort((a, b) => b.estimate - a.estimate || a.item.localeCompare(b.item));
        return result;
    }

    /** Return the total number of updates performed (sum of all increments). */
    public getTotalCount(): number {
        return this.totalCount;
    }
}
