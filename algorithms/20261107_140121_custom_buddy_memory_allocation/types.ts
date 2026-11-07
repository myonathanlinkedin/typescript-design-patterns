export type Order = number; // 0 corresponds to blocks of size minBlockSize, 1 to 2*minBlockSize, etc.

export interface AllocationResult {
    /** Offset (in bytes) from the start of the memory pool */
    offset: number;
    /** Actual block size allocated (always a power of two, >= requested size) */
    blockSize: number;
}
