import { BloomFilter } from "./engine";
import { assert } from "./types";

/** Simple test harness */
function runTests(): void {
    // Test 1: Basic add / contains
    const bf1 = new BloomFilter({ size: 1024, hashCount: 3 });
    const elems = ["apple", "banana", "cherry"];
    for (const e of elems) {
        bf1.add(e);
    }
    for (const e of elems) {
        assert(bf1.contains(e), `Element '${e}' should be reported as present`);
    }

    // Test 2: Non‑added element should (most likely) be absent
    const notAdded = "durian";
    assert(!bf1.contains(notAdded), "Element not added should be reported as absent (deterministic case)");

    // Test 3: Duplicate adds do not affect result
    bf1.add("apple");
    assert(bf1.contains("apple"), "Duplicate add must keep element present");

    // Test 4: Edge case – minimal size and hash count
    const bf2 = new BloomFilter({ size: 1, hashCount: 1 });
    bf2.add("x");
    assert(bf2.contains("x"), "Single‑bit filter should contain added element");
    // With size 1, any element hashes to position 0, so false positives are inevitable
    assert(bf2.contains("y"), "Single‑bit filter reports all elements as present after first insert");

    // Test 5: Optimal size / hash count calculations
    const expectedItems = 1000;
    const targetFp = 0.01; // 1%
    const optimalM = BloomFilter.optimalSize(expectedItems, targetFp);
    const optimalK = BloomFilter.optimalHashCount(optimalM, expectedItems);
    const bf3 = new BloomFilter({ size: optimalM, hashCount: optimalK });
    for (let i = 0; i < expectedItems; i++) {
        bf3.add(`item${i}`);
    }
    // Verify that false‑positive rate is close to target (deterministic bound)
    const observedFp = BloomFilter.falsePositiveRate(optimalM, optimalK, expectedItems);
    const tolerance = 0.005; // 0.5% tolerance
    assert(
        Math.abs(observedFp - targetFp) <= tolerance,
        `Observed false‑positive rate ${observedFp} deviates beyond tolerance from target ${targetFp}`
    );

    // Test 6: Large scale deterministic behavior
    const largeBF = new BloomFilter({ size: 8192, hashCount: 4 });
    const largeSet = new Set<string>();
    for (let i = 0; i < 500; i++) {
        const val = `key${i}`;
        largeSet.add(val);
        largeBF.add(val);
    }
    // All inserted keys must be reported present
    for (const v of largeSet) {
        assert(largeBF.contains(v), `Large BF must contain inserted key '${v}'`);
    }
    // Sample a few non‑inserted keys – they should mostly be absent
    const falsePositives: string[] = [];
    for (let i = 500; i < 550; i++) {
        const candidate = `key${i}`;
        if (largeBF.contains(candidate)) {
            falsePositives.push(candidate);
        }
    }
    // With these parameters, false positive rate should be low (< 5%)
    const fpRate = falsePositives.length / 50;
    assert(fpRate < 0.05, `False positive rate ${fpRate} exceeds 5% threshold`);
}

/** Demonstration entry point */
function demo(): void {
    console.log("=== Bloom Filter Demo ===");
    const bf = new BloomFilter({ size: 256, hashCount: 3 });
    const words = ["alpha", "beta", "gamma", "delta"];
    console.log("Adding words:", words);
    for (const w of words) {
        bf.add(w);
    }
    const queries = ["alpha", "epsilon", "gamma", "zeta"];
    for (const q of queries) {
        console.log(`Contains '${q}'?`, bf.contains(q));
    }
}

// Execute tests then demo
runTests();
console.log("All unit tests passed.");
demo();
