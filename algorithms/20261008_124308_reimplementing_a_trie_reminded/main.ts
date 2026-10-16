import { Trie } from "./core";
import * as assert from "assert";

/* ---------- Unit Tests ---------- */
function testInsertionAndSearch(): void {
    const trie = new Trie();
    trie.insert("apple");
    trie.insert("app");
    trie.insert("application");
    trie.insert("banana");
    assert.strictEqual(trie.contains("app"), true);
    assert.strictEqual(trie.contains("apple"), true);
    assert.strictEqual(trie.contains("application"), true);
    assert.strictEqual(trie.contains("apples"), false);
    assert.strictEqual(trie.contains("ban"), false);
    assert.strictEqual(trie.contains("banana"), true);
    console.log("testInsertionAndSearch passed");
}

function testDeletion(): void {
    const trie = new Trie();
    ["test", "tester", "testing", "team"].forEach(w => trie.insert(w));
    assert.strictEqual(trie.delete("testing"), true);
    assert.strictEqual(trie.contains("testing"), false);
    assert.strictEqual(trie.contains("tester"), true);
    assert.strictEqual(trie.delete("test"), true);
    assert.strictEqual(trie.contains("test"), false);
    assert.strictEqual(trie.contains("tester"), true);
    assert.strictEqual(trie.delete("nonexistent"), false);
    // Delete remaining words
    assert.strictEqual(trie.delete("tester"), true);
    assert.strictEqual(trie.delete("team"), true);
    // Trie should be empty now
    assert.deepStrictEqual(trie.autocomplete(""), []);
    console.log("testDeletion passed");
}

function testAutocomplete(): void {
    const trie = new Trie();
    const words = ["cat", "car", "cart", "dog", "dot", "dove", "cater"];
    words.forEach(w => trie.insert(w));

    const allC = trie.autocomplete("c");
    assert.deepStrictEqual(allC, ["car", "cart", "cat", "cater"]);

    const limited = trie.autocomplete("c", 3);
    assert.deepStrictEqual(limited, ["car", "cart", "cat"]);

    const emptyPrefix = trie.autocomplete("");
    assert.deepStrictEqual(emptyPrefix.sort(), words.sort());

    const noMatch = trie.autocomplete("z");
    assert.deepStrictEqual(noMatch, []);

    console.log("testAutocomplete passed");
}

function testEdgeCases(): void {
    const trie = new Trie();
    // Empty string handling
    trie.insert("");
    assert.strictEqual(trie.contains(""), false);
    assert.deepStrictEqual(trie.autocomplete(""), []);
    // Unicode characters
    trie.insert("ñandú");
    trie.insert("ñapa");
    assert.strictEqual(trie.contains("ñandú"), true);
    assert.deepStrictEqual(trie.autocomplete("ñ"), ["ñapa", "ñandú"]);
    console.log("testEdgeCases passed");
}

/* ---------- Simple Benchmark ---------- */
function benchmark(): void {
    const trie = new Trie();
    const wordCount = 100_000;
    const base = "word";
    console.time("Insert");
    for (let i = 0; i < wordCount; ++i) {
        trie.insert(base + i);
    }
    console.timeEnd("Insert");

    console.time("Search");
    for (let i = 0; i < wordCount; ++i) {
        assert.strictEqual(trie.contains(base + i), true);
    }
    console.timeEnd("Search");

    console.time("Autocomplete");
    const results = trie.autocomplete("word9", 10);
    assert.ok(results.length <= 10);
    console.timeEnd("Autocomplete");
    console.log(`Autocomplete sample: ${results.slice(0, 5).join(", ")}`);
}

/* ---------- Execute Tests ---------- */
function runAll(): void {
    testInsertionAndSearch();
    testDeletion();
    testAutocomplete();
    testEdgeCases();
    benchmark();
    console.log("All tests passed.");
}

runAll();
