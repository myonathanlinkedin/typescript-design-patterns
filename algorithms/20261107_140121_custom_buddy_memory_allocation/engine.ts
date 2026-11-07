import { Order, AllocationResult } from "./types";

/**
 * Buddy memory allocator for a fixed-size memory pool.
 *
 * Guarantees:
 *  - All block sizes are powers of two and at least `minBlockSize`.
 *  - No overlapping allocations.
 *  - Immediate coalescing on free when possible.
 *
 * Time complexity:
 *  - allocate: O(maxOrder) worst‑case (splitting).
 *  - free:     O(maxOrder) worst‑case (coalescing).
 *
 * Space complexity:
 *  - O(maxOrder) for the free‑list array.
 */
export class BuddyAllocator {
    /** Total size of the memory pool (must be power of two). */
    private readonly totalSize: number;
    /** Minimum allocatable block size (must be power of two). */
    private readonly minBlockSize: number;
    /** Number of orders: 0 … maxOrder inclusive. */
    private readonly maxOrder: number;
    /** Array of free lists indexed by order. Each list holds offsets of free blocks. */
    private readonly freeLists: number[][];

    /**
     * Construct a new allocator.
     * @param totalSize Must be a power of two and >= minBlockSize.
     * @param minBlockSize Must be a power of two.
     */
    constructor(totalSize: number, minBlockSize: number) {
        if (!isPowerOfTwo(totalSize)) {
            throw new Error("totalSize must be a power of two");
        }
        if (!isPowerOfTwo(minBlockSize)) {
            throw new Error("minBlockSize must be a power of two");
        }
        if (minBlockSize > totalSize) {
            throw new Error("minBlockSize cannot exceed totalSize");
        }
        this.totalSize = totalSize;
        this.minBlockSize = minBlockSize;
        this.maxOrder = log2Int(totalSize / minBlockSize);
        this.freeLists = Array.from({ length: this.maxOrder + 1 }, () => []);
        // Initially the whole pool is a single free block at maxOrder.
        this.freeLists[this.maxOrder].push(0);
    }

    /**
     * Allocate a block that can hold at least `size` bytes.
     * @returns AllocationResult with offset and actual block size, or null if insufficient memory.
     */
    allocate(size: number): AllocationResult | null {
        if (size <= 0) {
            throw new Error("Requested size must be positive");
        }
        const blockSize = Math.max(this.minBlockSize, nextPowerOfTwo(size));
        const order = this.sizeToOrder(blockSize);
        // Find the smallest order >= requested order that has a free block.
        let availableOrder = order;
        while (availableOrder <= this.maxOrder && this.freeLists[availableOrder].length === 0) {
            availableOrder++;
        }
        if (availableOrder > this.maxOrder) {
            // Out of memory.
            return null;
        }
        // Remove a block from the found order.
        let offset = this.freeLists[availableOrder].pop() as number;
        // Split down to the desired order.
        while (availableOrder > order) {
            availableOrder--;
            const buddyOffset = offset + this.orderToSize(availableOrder);
            // The right half becomes a free buddy.
            this.freeLists[availableOrder].push(buddyOffset);
            // Continue with the left half (offset unchanged).
        }
        return { offset, blockSize };
    }

    /**
     * Free a previously allocated block.
     * @param offset Offset returned by allocate().
     * @param size   Original requested size (not the internal block size).
     */
    free(offset: number, size: number): void {
        if (offset < 0 || offset >= this.totalSize) {
            throw new Error("Invalid offset");
        }
        if (size <= 0) {
            throw new Error("Invalid size");
        }
        const blockSize = Math.max(this.minBlockSize, nextPowerOfTwo(size));
        let order = this.sizeToOrder(blockSize);
        let currentOffset = offset;

        while (order < this.maxOrder) {
            const buddyOffset = this.findBuddy(currentOffset, order);
            const buddyIndex = this.freeLists[order].indexOf(buddyOffset);
            if (buddyIndex === -1) {
                // Buddy not free; cannot coalesce.
                break;
            }
            // Remove buddy from free list.
            this.freeLists[order].splice(buddyIndex, 1);
            // Determine new combined block's offset (the lower of the two).
            currentOffset = Math.min(currentOffset, buddyOffset);
            order++;
        }
        // Insert the (possibly coalesced) block into its free list.
        this.freeLists[order].push(currentOffset);
    }

    /** Helper: convert block size to order index. */
    private sizeToOrder(size: number): Order {
        const ratio = size / this.minBlockSize;
        if (!isPowerOfTwo(ratio)) {
            throw new Error("sizeToOrder called with non‑power‑of‑two size");
        }
        return log2Int(ratio);
    }

    /** Helper: convert order index to block size. */
    private orderToSize(order: Order): number {
        return this.minBlockSize << order;
    }

    /** Compute buddy offset for a block at given order. */
    private findBuddy(offset: number, order: Order): number {
        const blockSize = this.orderToSize(order);
        return offset ^ blockSize;
    }

    /** Expose internal free‑list state for testing (read‑only). */
    getFreeListsSnapshot(): ReadonlyArray<readonly number[]> {
        // Return deep copies to preserve encapsulation.
        return this.freeLists.map(list => list.slice());
    }
}

/* ---------- Utility Functions (pure, no side effects) ---------- */
function isPowerOfTwo(x: number): boolean {
    return x > 0 && (x & (x - 1)) === 0;
}

/**
 * Return the smallest power of two >= x.
 * For x <= 1 returns 1.
 */
function nextPowerOfTwo(x: number): number {
    if (x <= 1) return 1;
    let p = 1;
    while (p < x) {
        p <<= 1;
    }
    return p;
}

/**
 * Compute integer log2 of a power‑of‑two number.
 * Throws if x is not a power of two.
 */
function log2Int(x: number): number {
    if (!isPowerOfTwo(x)) {
        throw new Error(`log2Int requires a power of two, got ${x}`);
    }
    return Math.round(Math.log2(x));
}
