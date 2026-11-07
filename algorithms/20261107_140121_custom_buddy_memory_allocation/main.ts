import { BuddyAllocator } from "./engine";

/* Simple assertion helper */
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/* Test suite */
function runTests(): void {
    // Create allocator: 1024 bytes total, minimum block 32 bytes.
    const allocator = new BuddyAllocator(1024, 32);

    // 1. Basic allocation.
    const a1 = allocator.allocate(50);
    assert(a1 !== null, "a1 should allocate");
    assert(a1!.blockSize === 64, "a1 block size should round up to 64");
    const a1Offset = a1!.offset;

    // 2. Allocate another block that fits in the same order.
    const a2 = allocator.allocate(30);
    assert(a2 !== null, "a2 should allocate");
    assert(a2!.blockSize === 32, "a2 block size should be minBlockSize (32)");
    const a2Offset = a2!.offset;
    assert(a2Offset !== a1Offset, "Offsets must differ");

    // 3. Allocate a large block (256 bytes).
    const a3 = allocator.allocate(200);
    assert(a3 !== null, "a3 should allocate");
    assert(a3!.blockSize === 256, "a3 block size should be 256");
    const a3Offset = a3!.offset;

    // 4. Free a2 and ensure it can be reallocated.
    allocator.free(a2Offset, 30);
    const a4 = allocator.allocate(20);
    assert(a4 !== null, "a4 should allocate after freeing a2");
    assert(a4!.blockSize === 32, "a4 block size should be 32");
    assert(a4!.offset === a2Offset, "a4 should reuse a2's offset");

    // 5. Free a1 and a4 (both 32‑byte blocks) and verify coalescing into a 64‑byte block.
    allocator.free(a1Offset, 50);
    allocator.free(a4!.offset, 20);
    // After freeing both buddies, there should be a free 64‑byte block at the lower offset.
    const freeLists = allocator.getFreeListsSnapshot();
    // Order 1 corresponds to 64‑byte blocks (since minBlockSize=32).
    const order64 = 1;
    const has64 = freeLists[order64].some(off => off === Math.min(a1Offset, a4!.offset));
    assert(has64, "Coalesced 64‑byte block should be present after freeing buddies");

    // 6. Exhaust memory.
    const allocations: { offset: number; size: number }[] = [];
    let remaining = true;
    while (remaining) {
        const res = allocator.allocate(128);
        if (res === null) {
            remaining = false;
        } else {
            allocations.push({ offset: res.offset, size: res.blockSize });
        }
    }
    // Total allocated should not exceed totalSize.
    const totalAllocated = allocations.reduce((sum, cur) => sum + cur.size, 0);
    assert(totalAllocated <= 1024, "Allocated memory must not exceed pool size");

    // 7. Free everything and ensure the allocator returns to initial state.
    for (const blk of allocations) {
        allocator.free(blk.offset, blk.size);
    }
    // Also free a3 which was allocated earlier.
    allocator.free(a3Offset, 200);
    // After all frees, only one block of max order should exist at offset 0.
    const finalFreeLists = allocator.getFreeListsSnapshot();
    for (let order = 0; order < finalFreeLists.length; order++) {
        const list = finalFreeLists[order];
        if (order === allocator['maxOrder']) {
            assert(list.length === 1 && list[0] === 0, "Only the full pool should be free");
        } else {
            assert(list.length === 0, `Order ${order} free list should be empty`);
        }
    }

    console.log("All BuddyAllocator tests passed.");
}

/* Run the test suite */
runTests();
