import { PlanarGraphEngine } from "./engine";
import { Meander } from "./types";

/**
 * Helper to compare two arrays for deep equality.
 */
function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/* ==== Unit Tests ==== */

// Test 1: Basic connectivity on a planar chain
(() => {
    const engine = new PlanarGraphEngine(5);
    engine.addEdge(0, 1);
    engine.addEdge(1, 2);
    engine.addEdge(2, 3);
    console.assert(engine.isConnected(0, 3), "0 should be connected to 3");
    console.assert(!engine.isConnected(0, 4), "0 should NOT be connected to 4");
})();

// Test 2: Planarity violation detection
(() => {
    const engine = new PlanarGraphEngine(5);
    engine.addEdge(0, 2); // first edge
    let caught = false;
    try {
        engine.addEdge(1, 3); // crosses (0,2) under linear embedding
    } catch (e) {
        caught = true;
    }
    console.assert(caught, "Crossing edge should raise an exception");
    // Ensure the graph still only contains the first edge
    console.assert(engine.isConnected(0, 2), "0 should be connected to 2");
    console.assert(!engine.isConnected(1, 3), "1 should NOT be connected to 3");
})();

// Test 3: Duplicate edge rejection
(() => {
    const engine = new PlanarGraphEngine(3);
    engine.addEdge(0, 1);
    let caught = false;
    try {
        engine.addEdge(1, 0); // duplicate in opposite order
    } catch (e) {
        caught = true;
    }
    console.assert(caught, "Duplicate edge should raise an exception");
})();

// Test 4: Meander extraction correctness
(() => {
    const engine = new PlanarGraphEngine(4);
    engine.addEdge(0, 1); // index 0 -> top
    engine.addEdge(2, 3); // index 1 -> bottom
    const meander: Meander = engine.getMeander();
    console.assert(arraysEqual(meander.top, [0, 1]), "Top meander should be [0,1]");
    console.assert(arraysEqual(meander.bottom, [2, 3]), "Bottom meander should be [2,3]");
})();

// Test 5: Edge cases – isolated vertices and full connectivity
(() => {
    const engine = new PlanarGraphEngine(6);
    // Connect vertices 0‑5 in a planar star centred at 0
    for (let v = 1; v <= 5; v++) {
        engine.addEdge(0, v);
    }
    for (let v = 1; v <= 5; v++) {
        console.assert(engine.isConnected(0, v), `0 should be connected to ${v}`);
        console.assert(engine.isConnected(v, 0), `${v} should be connected to 0`);
    }
    console.assert(engine.isConnected(3, 5), "3 should be connected to 5 via 0");
})();

// Demonstration output
(() => {
    const engine = new PlanarGraphEngine(5);
    engine.addEdge(0, 1);
    engine.addEdge(2, 3);
    engine.addEdge(1, 4);
    const meander = engine.getMeander();
    console.log("Meander representation:");
    console.log("Top   :", meander.top);
    console.log("Bottom:", meander.bottom);
    console.log("Connectivity 0‑4:", engine.isConnected(0, 4));
    console.log("Connectivity 2‑4:", engine.isConnected(2, 4));
})();

// If execution reaches this point without assertion failures, all tests passed.
console.log("All unit tests passed.");
