import { MemoryStore } from "./engine";
import { MemoryEntry, QueryResult } from "./types";
import * as assert from "assert";

/* ---------- Helper for deterministic floating‑point comparison ---------- */
function approxEqual(a: number, b: number, epsilon = 1e-9): boolean {
    return Math.abs(a - b) < epsilon;
}

/* --------------------------- Unit Tests --------------------------- */

// Test 1: Empty store returns empty result
{
    const store = new MemoryStore<string>();
    const results = store.query([0, 0, 0], 5);
    assert.deepStrictEqual(results, [], "Empty store should yield empty array");
}

// Test 2: Adding and retrieving a single entry
{
    const store = new MemoryStore<number>();
    const entry: MemoryEntry<number> = {
        id: "item1",
        embedding: [1, 0, 0],
        data: 42,
    };
    store.add(entry);
    assert.strictEqual(store.size(), 1, "Store size should be 1 after insertion");

    const query = [1, 0, 0];
    const results = store.query(query, 1);
    assert.strictEqual(results.length, 1, "Should return one result");
    assert.strictEqual(results[0].id, "item1");
    assert.strictEqual(results[0].data, 42);
    assert.ok(approxEqual(results[0].similarity, 1), "Similarity with identical vector must be 1");
}

// Test 3: Overwrite existing entry with same id
{
    const store = new MemoryStore<string>();
    store.add({ id: "dup", embedding: [0, 1], data: "first" });
    store.add({ id: "dup", embedding: [1, 0], data: "second" }); // overwrite
    assert.strictEqual(store.size(), 1, "Duplicate id should not increase size");

    const res = store.query([1, 0], 1);
    assert.strictEqual(res[0].data, "second", "Data should reflect overwritten entry");
}

// Test 4: Top‑K ordering and similarity scores
{
    const store = new MemoryStore<string>();
    const entries: MemoryEntry<string>[] = [
        { id: "a", embedding: [1, 0, 0], data: "A" },
        { id: "b", embedding: [0, 1, 0], data: "B" },
        { id: "c", embedding: [0, 0, 1], data: "C" },
        { id: "d", embedding: [1, 1, 0], data: "D" },
    ];
    entries.forEach(e => store.add(e));

    const query = [1, 0, 0];
    const top3 = store.query(query, 3);
    assert.strictEqual(top3.length, 3, "Should return three results");
    // Expected order: a (1.0), d (~0.7071), b (0.0) or c (0.0) – tie broken by insertion order after sorting
    assert.strictEqual(top3[0].id, "a");
    assert.ok(approxEqual(top3[0].similarity, 1));
    assert.strictEqual(top3[1].id, "d");
    assert.ok(approxEqual(top3[1].similarity, Math.SQRT1_2));
    // The third result similarity should be 0
    assert.ok(approxEqual(top3[2].similarity, 0));
}

// Test 5: Zero‑vector handling (should yield similarity 0)
{
    const store = new MemoryStore<number>();
    store.add({ id: "zero", embedding: [0, 0, 0], data: 0 });
    store.add({ id: "norm", embedding: [1, 0, 0], data: 1 });

    const query = [0, 0, 0];
    const results = store.query(query, 2);
    // Both similarities must be 0; order is deterministic by id after sorting (stable sort)
    assert.strictEqual(results.length, 2);
    results.forEach(r => assert.ok(approxEqual(r.similarity, 0)));
}

// Test 6: Dimension mismatch errors
{
    const store = new MemoryStore<string>();
    store.add({ id: "valid", embedding: [1, 2], data: "ok" });
    assert.throws(() => {
        store.add({ id: "bad", embedding: [1, 2, 3], data: "nope" });
    }, /Embedding dimension mismatch/);

    assert.throws(() => {
        store.query([1, 2, 3], 1);
    }, /Query embedding dimension mismatch/);
}

// Test 7: topK larger than store size returns all entries
{
    const store = new MemoryStore<string>();
    store.add({ id: "x", embedding: [1, 0], data: "X" });
    const results = store.query([1, 0], 10);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, "x");
}

/* --------------------------- Demo --------------------------- */
{
    const store = new MemoryStore<{ description: string }>();
    store.add({
        id: "apple",
        embedding: [0.9, 0.1, 0.0],
        data: { description: "A fruit that keeps doctors away." },
    });
    store.add({
        id: "banana",
        embedding: [0.8, 0.2, 0.0],
        data: { description: "A yellow elongated fruit." },
    });
    store.add({
        id: "car",
        embedding: [0.0, 0.0, 1.0],
        data: { description: "A vehicle with four wheels." },
    });

    const query = [0.85, 0.15, 0.0]; // Closer to apple/banana
    const top2 = store.query(query, 2);
    console.log("Top‑2 semantic matches:");
    top2.forEach(r => {
        console.log(`- ${r.id} (similarity=${r.similarity.toFixed(4)}): ${r.data.description}`);
    });
}

// If the script reaches this point without assertion failures, all tests passed.
console.log("All unit tests passed.");
