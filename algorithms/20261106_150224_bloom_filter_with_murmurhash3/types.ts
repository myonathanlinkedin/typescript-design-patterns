export interface BloomFilterOptions {
    /** Number of bits in the filter */
    size: number;
    /** Number of hash functions to use */
    hashCount: number;
    /** Optional seeds for the hash functions; if omitted, sequential seeds starting at 0 are used */
    seeds?: number[];
}

/** Simple assertion utility for unit tests */
export function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}
