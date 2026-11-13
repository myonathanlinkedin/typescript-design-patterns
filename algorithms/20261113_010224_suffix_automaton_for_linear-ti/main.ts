import { SuffixAutomaton } from "./engine";
import * as assert from "assert";

/**
 * Helper to run a single test case and report failures with context.
 */
function test(description: string, fn: () => void): void {
    try {
        fn();
        console.log(`✅ ${description}`);
    } catch (e) {
        console.error(`❌ ${description}`);
        console.error(e);
        process.exitCode = 1;
    }
}

/* -------------------- Unit Tests -------------------- */

// Basic construction and empty‑string handling
test("Empty source string builds a valid automaton", () => {
    const sam = new SuffixAutomaton("");
    assert.strictEqual(sam.contains(""), true, "empty substring should be found");
    assert.strictEqual(sam.contains("a"), false, "non‑empty substring cannot exist");
    assert.strictEqual(sam.getStates().length, 1, "only root state should exist");
});

// Simple word
test("Single‑character source", () => {
    const sam = new SuffixAutomaton("a");
    assert.strictEqual(sam.contains("a"), true);
    assert.strictEqual(sam.contains(""), true);
    assert.strictEqual(sam.contains("b"), false);
});

// Repeated characters
test("Repeated characters source", () => {
    const sam = new SuffixAutomaton("aaa");
    assert.strictEqual(sam.contains("a"), true);
    assert.strictEqual(sam.contains("aa"), true);
    assert.strictEqual(sam.contains("aaa"), true);
    assert.strictEqual(sam.contains("aaaa"), false);
    assert.strictEqual(sam.contains("b"), false);
});

// Mixed characters
test("Mixed characters source", () => {
    const sam = new SuffixAutomaton("ababc");
    const positives = ["a", "b", "ab", "ba", "bab", "abc", "ababc"];
    const negatives = ["c", "ac", "bb", "abbc", "ababa"];
    for (const s of positives) {
        assert.strictEqual(sam.contains(s), true, `should contain '${s}'`);
    }
    for (const s of negatives) {
        assert.strictEqual(sam.contains(s), false, `should not contain '${s}'`);
    }
});

// Edge case: substring equal to source
test("Substring equal to the whole source", () => {
    const src = "thequickbrownfox";
    const sam = new SuffixAutomaton(src);
    assert.strictEqual(sam.contains(src), true);
});

// Stress test: long random string (deterministic)
test("Long deterministic string", () => {
    const alphabet = "abc";
    const length = 1000;
    let src = "";
    for (let i = 0; i < length; ++i) {
        src += alphabet[i % alphabet.length];
    }
    const sam = new SuffixAutomaton(src);
    // Verify a few known substrings
    assert.strictEqual(sam.contains("abca"), true);
    assert.strictEqual(sam.contains("bcab"), true);
    assert.strictEqual(sam.contains("cabca"), true);
    // Verify a non‑existent substring
    assert.strictEqual(sam.contains("d"), false);
    // Verify empty substring
    assert.strictEqual(sam.contains(""), true);
});

/* -------------------- Demo -------------------- */
console.log("\n--- Demo: Substring queries on 'abracadabra' ---");
const demoSAM = new SuffixAutomaton("abracadabra");
const queries = ["abra", "cad", "dab", "ra", "br", "acada", ""];
for (const q of queries) {
    console.log(`contains('${q}') => ${demoSAM.contains(q)}`);
}
