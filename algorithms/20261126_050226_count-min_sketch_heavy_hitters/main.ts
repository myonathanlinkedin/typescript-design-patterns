import { strict as assert } from "assert";
import { CountMinSketch } from "./engine";
import { CountMinSketchParams } from "./types";

/** Helper to create a sketch with reasonable defaults for tests. */
function makeSketch(width: number = 1000, depth: number = 5): CountMinSketch {
    const params: CountMinSketchParams = { width, depth };
    return new CountMinSketch(params);
}

/* ---------- Unit Tests ---------- */

// 1. Construction edge cases
(() => {
    assert.throws(() => new CountMinSketch({ width: 0, depth: 5 }), /width/);
    assert.throws(() => new CountMinSketch({ width: 10, depth: -1 }), /depth/);
})();

// 2. Basic update / estimate correctness
(() => {
    const cms = makeSketch(200, 4);
    cms.update("apple", 3);
    cms.update("banana", 5);
    cms.update("apple", 2); // total apple = 5

    const estApple = cms.estimate("apple");
    const estBanana = cms.estimate("banana");
    const estCherry = cms.estimate("cherry"); // never inserted

    // Estimates must be at least true count
    assert.ok(estApple >= 5, "apple estimate too low");
    assert.ok(estBanana >= 5, "banana estimate too low");
    assert.ok(estCherry >= 0, "cherry estimate negative");

    // Error bound: totalCount / width
    const total = cms.getTotalCount(); // 10
    const epsilon = total / 200; // 0.05, but we work with integers, so floor to 1
    const bound = Math.ceil(epsilon);
    assert.ok(estApple <= 5 + bound, "apple estimate exceeds error bound");
    assert.ok(estBanana <= 5 + bound, "banana estimate exceeds error bound");
})();

// 3. Zero and negative increments handling
(() => {
    const cms = makeSketch();
    cms.update("zero", 0); // should be no‑op
    assert.equal(cms.estimate("zero"), 0);
    assert.throws(() => cms.update("neg", -1), /increment/);
})();

// 4. Heavy‑hitter extraction correctness
(() => {
    const cms = makeSketch(500, 3);
    const frequencies: Record<string, number> = {
        "alpha": 120,
        "beta": 80,
        "gamma": 30,
        "delta": 5,
        "epsilon": 200,
    };
    for (const [item, cnt] of Object.entries(frequencies)) {
        cms.update(item, cnt);
    }

    // Threshold 100 should return epsilon and alpha (order deterministic)
    const hitters100 = cms.heavyHitters(100);
    const names100 = hitters100.map(h => h.item);
    assert.deepEqual(names100, ["epsilon", "alpha"]);

    // Threshold 0 returns all observed items
    const allHitters = cms.heavyHitters(0);
    const allNames = allHitters.map(h => h.item).sort();
    assert.deepEqual(allNames, Object.keys(frequencies).sort());

    // Threshold larger than any estimate returns empty array
    const none = cms.heavyHitters(1000);
    assert.equal(none.length, 0);
})();

// 5. Deterministic ordering of heavy hitters
(() => {
    const cms = makeSketch(300, 4);
    cms.update("x", 10);
    cms.update("y", 10);
    cms.update("z", 5);
    const hitters = cms.heavyHitters(5);
    // x and y have same estimate; should be ordered lexicographically
    assert.deepEqual(hitters.map(h => h.item), ["x", "y", "z"]);
})();

// 6. Large count handling (no overflow for 32‑bit unsigned up to safe integer)
(() => {
    const cms = makeSketch(100, 2);
    const big = 1_000_000;
    cms.update("big", big);
    const est = cms.estimate("big");
    assert.ok(est >= big, "large count underestimated");
    // Ensure total count reflects the large increment
    assert.equal(cms.getTotalCount(), big);
})();

console.log("All Count‑Min Sketch tests passed.");
