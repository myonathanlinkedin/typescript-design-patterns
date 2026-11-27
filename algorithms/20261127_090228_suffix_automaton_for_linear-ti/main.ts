import { SuffixAutomaton } from "./core";
import * as assert from "assert";

function testContains() {
    const sam = new SuffixAutomaton("ababa");
    assert.strictEqual(sam.contains("aba"), true);
    assert.strictEqual(sam.contains("bab"), true);
    assert.strictEqual(sam.contains("ababa"), true);
    assert.strictEqual(sam.contains("ba"), true);
    assert.strictEqual(sam.contains("c"), false);
    assert.strictEqual(sam.contains(""), true);
}

function testCountOccurrences() {
    const sam = new SuffixAutomaton("ababa");
    assert.strictEqual(sam.countOccurrences("a"), 3);
    assert.strictEqual(sam.countOccurrences("b"), 2);
    assert.strictEqual(sam.countOccurrences("ab"), 2);
    assert.strictEqual(sam.countOccurrences("ba"), 2);
    assert.strictEqual(sam.countOccurrences("aba"), 2);
    assert.strictEqual(sam.countOccurrences("ababa"), 1);
    assert.strictEqual(sam.countOccurrences("c"), 0);
    assert.strictEqual(sam.countOccurrences(""), 0);
}

function testLongestCommonSubstring() {
    const sam = new SuffixAutomaton("xabxac");
    const lcs = sam.longestCommonSubstring("abcabxabcd");
    assert.strictEqual(lcs, "abxa");
}

function testEdgeCases() {
    const emptySam = new SuffixAutomaton("");
    assert.strictEqual(emptySam.contains(""), true);
    assert.strictEqual(emptySam.contains("a"), false);
    assert.strictEqual(emptySam.countOccurrences(""), 0);
    assert.strictEqual(emptySam.countOccurrences("a"), 0);
    assert.strictEqual(emptySam.longestCommonSubstring("anything"), "");
}

function testStateCount() {
    const sam = new SuffixAutomaton("aaaaa");
    // For a string of n identical chars, SAM has n+1 states.
    assert.strictEqual(sam.size(), 6);
}

function runAll() {
    testContains();
    testCountOccurrences();
    testLongestCommonSubstring();
    testEdgeCases();
    testStateCount();
    console.log("All tests passed.");
}

runAll();
