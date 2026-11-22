import { BloomFilter } from "./core";
import * as assert from "assert";

/* ---------- Unit Tests ---------- */

function testBasicOperations(): void {
    const bf = new BloomFilter<string>(100, 0.01);
    const present = ["apple", "banana", "cherry"];
    const absent = ["durian", "elderberry", "fig"];

    for (const item of present) {
        assert.strictEqual(bf.contains(item), false, `Should not contain ${item} before add`);
        bf.add(item);
        assert.strictEqual(bf.contains(item), true, `Should contain ${item} after add`);
    }

    for (const item of absent) {
        assert.strictEqual(bf.contains(item), false, `Should not contain ${item}`);
    }

    // Duplicate addition must not affect result
    bf.add("apple");
    assert.strictEqual(bf.contains("apple"), true, "Duplicate add must keep true");
    console.log("testBasicOperations passed");
}

function testFalsePositiveRate(): void {
    const n = 1000;
    const p = 0.02; // target false positive rate
    const bf = new BloomFilter<number>(n, p);
    const inserted = new Set<number>();
    const rng = seededRandom(0xdeadbeef);

    // Insert n distinct numbers
    while (inserted.size < n) {
        const v = Math.floor(rng() * 1_000_000);
        inserted.add(v);
        bf.add(v);
    }

    // Test on m non‑inserted numbers
    const testCount = 10_000;
    let falsePositives = 0;
    for (let i = 0; i < testCount; i++) {
        const v = Math.floor(rng() * 1_000_000) + 1_000_000; // ensure different range
        if (bf.contains(v)) falsePositives++;
    }

    const observedRate = falsePositives / testCount;
    const tolerance = p * 1.5; // allow 50% slack
    assert.ok(observedRate <= tolerance,
        `Observed false positive rate ${observedRate} exceeds tolerance ${tolerance}`);
    console.log(`testFalsePositiveRate passed (observed=${observedRate.toFixed(4)})`);
}

/* Simple deterministic pseudo‑random generator (LCG) */
function seededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        // Constants from Numerical Recipes
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

/* ---------- Benchmark (optional) ---------- */
function benchmark(): void {
    const n = 500_000;
    const bf = new BloomFilter<string>(n, 0.01);
    const rng = seededRandom(0x12345678);
    console.time("Add");
    for (let i = 0; i < n; i++) {
        bf.add(`key_${Math.floor(rng() * 1_000_000)}`);
    }
    console.timeEnd("Add");

    console.time("Query");
    let hits = 0;
    for (let i = 0; i < n; i++) {
        if (bf.contains(`key_${Math.floor(rng() * 1_000_000)}`)) hits++;
    }
    console.timeEnd("Query");
    console.log(`Benchmark queries reported ${hits} positive results`);
}

/* ---------- Execute Tests ---------- */
function runAll(): void {
    console.log("Running BloomFilter unit tests...");
    testBasicOperations();
    testFalsePositiveRate();
    console.log("All unit tests passed.\n");

    console.log("Running simple benchmark...");
    benchmark();
}

runAll();
