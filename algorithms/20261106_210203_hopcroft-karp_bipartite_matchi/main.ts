import { HopcroftKarp } from "./core";
import * as assert from "assert";

/**
 * Brute‑force verification for tiny bipartite graphs (n ≤ 6).
 * Enumerates all subsets of edges and returns the maximum matching size.
 */
function bruteForceMaxMatching(nLeft: number, nRight: number, edges: [number, number][]): number {
    const m = edges.length;
    let best = 0;
    const leftUsed = new Array(nLeft).fill(false);
    const rightUsed = new Array(nRight).fill(false);

    function backtrack(idx: number, count: number): void {
        if (idx === m) {
            if (count > best) best = count;
            return;
        }
        // Option 1: skip current edge
        backtrack(idx + 1, count);

        // Option 2: take current edge if it does not conflict
        const [u, v] = edges[idx];
        if (!leftUsed[u] && !rightUsed[v]) {
            leftUsed[u] = rightUsed[v] = true;
            backtrack(idx + 1, count + 1);
            leftUsed[u] = rightUsed[v] = false;
        }
    }

    backtrack(0, 0);
    return best;
}

/* ---------- Unit Tests ---------- */
function testEmptyGraph(): void {
    const hk = new HopcroftKarp(3, 3, []);
    const size = hk.maxMatching();
    assert.strictEqual(size, 0, "Empty graph should have matching size 0");
    assert.deepStrictEqual(hk.getMatching(), [-1, -1, -1]);
}

function testPerfectMatching(): void {
    const edges: [number, number][] = [
        [0, 0],
        [1, 1],
    ];
    const hk = new HopcroftKarp(2, 2, edges);
    const size = hk.maxMatching();
    assert.strictEqual(size, 2, "Perfect matching of size 2 expected");
    const matching = hk.getMatching();
    assert.deepStrictEqual(matching.sort(), [0, 1], "Each left vertex should be matched uniquely");
}

function testPartialMatching(): void {
    const edges: [number, number][] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [2, 2],
    ];
    const hk = new HopcroftKarp(3, 3, edges);
    const size = hk.maxMatching();
    assert.strictEqual(size, 3, "Maximum matching size should be 3");
    const matching = hk.getMatching();
    const usedRight = new Set<number>();
    for (const v of matching) {
        if (v !== -1) {
            assert(!usedRight.has(v), "Right vertex matched twice");
            usedRight.add(v);
        }
    }
}

function testRandomSmallGraphs(trials = 200): void {
    const randInt = (max: number) => Math.floor(Math.random() * max);
    for (let t = 0; t < trials; t++) {
        const nL = randInt(5) + 1; // 1‑5
        const nR = randInt(5) + 1;
        const possible: [number, number][] = [];
        for (let u = 0; u < nL; u++) {
            for (let v = 0; v < nR; v++) {
                if (Math.random() < 0.5) possible.push([u, v]);
            }
        }
        const hk = new HopcroftKarp(nL, nR, possible);
        const hkSize = hk.maxMatching();
        const bruteSize = bruteForceMaxMatching(nL, nR, possible);
        assert.strictEqual(
            hkSize,
            bruteSize,
            `Mismatch on random graph (trial ${t}): HK=${hkSize}, brute=${bruteSize}`
        );
    }
}

/* ---------- Execute Tests ---------- */
function runAllTests(): void {
    testEmptyGraph();
    testPerfectMatching();
    testPartialMatching();
    testRandomSmallGraphs();
    console.log("All Hopcroft‑Karp tests passed.");
}

runAllTests();
