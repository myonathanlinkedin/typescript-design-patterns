import { Heap, GC, HeapObject } from "./core.ts";

/* Simple assertion helper */
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/* Test 1: basic reachability */
function testBasicGC(): void {
    const heap = new Heap();
    const gc = new GC(heap);

    const a = heap.allocate();
    const b = heap.allocate();
    const c = heap.allocate(); // unreachable

    a.setField("ref", b, gc);
    // No reference to c

    gc.addRoot(a);
    const reclaimed = gc.collect();

    assert(reclaimed.length === 1 && reclaimed[0] === c.id,
        "Unreachable object c should be reclaimed");
    assert(heap.size() === 2, "Heap should contain only a and b after collection");
}

/* Test 2: incremental GC with mutation (write barrier) */
function testIncrementalWithBarrier(): void {
    const heap = new Heap();
    const gc = new GC(heap);

    const root = heap.allocate();
    const childWhite = heap.allocate(); // will stay white initially
    const childBlack = heap.allocate();

    // Build initial graph: root → childBlack
    root.setField("toBlack", childBlack, gc);
    // childBlack has no outgoing refs yet

    gc.addRoot(root);
    gc.start(); // mark root gray

    // Perform one step: root becomes black, childBlack becomes gray
    gc.step(); // scans root, discovers childBlack
    gc.step(); // scans childBlack, no further refs

    // At this point, childBlack is black, childWhite is white
    assert(childBlack.color === 2, "childBlack should be black");
    assert(childWhite.color === 0, "childWhite should be white");

    // Mutate black object to point to a white object
    childBlack.setField("toWhite", childWhite, gc); // write barrier should promote childWhite

    // Verify that the barrier promoted childWhite to gray
    assert(childWhite.color === 1, "childWhite should be gray after write barrier");

    // Continue marking until completion
    while (gc.step()) { /* empty */ }

    // Sweep should reclaim nothing
    const reclaimed = gc.sweep();
    assert(reclaimed.length === 0, "No objects should be reclaimed after proper barrier handling");
    assert(heap.size() === 3, "All three objects should remain");
}

/* Test 3: cyclic structures */
function testCyclicGC(): void {
    const heap = new Heap();
    const gc = new GC(heap);

    const x = heap.allocate();
    const y = heap.allocate();

    // Create a cycle x ↔ y
    x.setField("toY", y, gc);
    y.setField("toX", x, gc);

    gc.addRoot(x);
    const reclaimed = gc.collect();

    assert(reclaimed.length === 0, "Cyclic reachable objects should not be reclaimed");
    assert(heap.size() === 2, "Both objects should remain");
}

/* Run all tests */
function runTests(): void {
    testBasicGC();
    testIncrementalWithBarrier();
    testCyclicGC();
    console.log("All tests passed.");
}

/* Entry point */
runTests();
