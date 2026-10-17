import { Edge, Graph } from "./types";
import {
    addDeterministicShortcuts,
    distancePreserver,
    dijkstraLimitedHops,
    allPairsShortestDistances,
} from "./engine";

/* Simple assertion helper */
function assert(condition: boolean, msg?: string): void {
    if (!condition) {
        throw new Error(msg ?? "Assertion failed");
    }
}

/* Helper to compare floating point numbers */
function approxEqual(a: number, b: number, eps = 1e-9): boolean {
    return Math.abs(a - b) <= eps;
}

/* ---------- Test Cases ---------- */

// 1. Empty graph
(() => {
    const g: Graph = { n: 0, edges: [] };
    const shortcuts = addDeterministicShortcuts(g, 2);
    assert(shortcuts.n === 0, "Empty graph should stay empty");
    assert(shortcuts.edges.length === 0, "No edges expected");
})();

// 2. Single vertex, no edges
(() => {
    const g: Graph = { n: 1, edges: [] };
    const sp = distancePreserver(g, [0]);
    assert(sp.n === 1 && sp.edges.length === 0, "Single‑node preserver");
    const withSc = addDeterministicShortcuts(g, 1);
    assert(withSc.edges.length === 0, "No shortcuts needed");
})();

// 3. Simple directed triangle
(() => {
    const edges: Edge[] = [
        { from: 0, to: 1, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 2, weight: 10 },
    ];
    const g: Graph = { n: 3, edges };
    const allDist = allPairsShortestDistances(g);
    // Verify Floyd‑Warshall correctness on this tiny graph
    assert(approxEqual(allDist[0][2], 5), "Shortest 0→2 should be 5 via 1");

    // Distance preserver for terminals {0,2}
    const pres = distancePreserver(g, [0, 2]);
    // The edge 0→2 (weight 10) is not needed; path 0→1→2 must be kept
    const neededKeys = new Set(pres.edges.map(e => `${e.from}->${e.to}`));
    assert(neededKeys.has("0->1") && neededKeys.has("1->2"), "Preserver must contain 0→1 and 1→2");
    assert(!neededKeys.has("0->2"), "Edge 0→2 should be omitted");

    // Shortcut construction with maxHops = 1
    const gSc = addDeterministicShortcuts(g, 1);
    // Since 0→2 needs 2 hops originally, a shortcut should be added
    const scKeys = new Set(gSc.edges.map(e => `${e.from}->${e.to}`));
    assert(scKeys.has("0->2"), "Shortcut 0→2 must be added");
    // Weight of shortcut must equal exact distance (5)
    const scEdge = gSc.edges.find(e => e.from === 0 && e.to === 2)!;
    assert(approxEqual(scEdge.weight, 5), "Shortcut weight must be exact distance");
})();

// 4. Verify hop bound after adding shortcuts
(() => {
    const edges: Edge[] = [
        { from: 0, to: 1, weight: 1 },
        { from: 1, to: 2, weight: 1 },
        { from: 2, to: 3, weight: 1 },
        { from: 3, to: 4, weight: 1 },
    ];
    const g: Graph = { n: 5, edges };
    const maxHops = 2;
    const gSc = addDeterministicShortcuts(g, maxHops);

    // For every ordered pair, ensure a path of ≤ maxHops exists
    for (let u = 0; u < gSc.n; ++u) {
        const hd = dijkstraLimitedHops(gSc, u, maxHops);
        for (let v = 0; v < gSc.n; ++v) {
            if (u === v) continue;
            assert(
                hd[v].hops <= maxHops,
                `Pair (${u},${v}) exceeds hop bound after shortcuts`
            );
            // Also verify distance does not increase (shortcut may only improve)
            const originalDist = allPairsShortestDistances(g)[u][v];
            assert(
                approxEqual(hd[v].distance, originalDist) ||
                    hd[v].distance < originalDist + 1e-9,
                `Distance changed for (${u},${v})`
            );
        }
    }
})();

// 5. Larger random‑like graph (deterministic construction)
(() => {
    const edges: Edge[] = [
        { from: 0, to: 1, weight: 4 },
        { from: 0, to: 2, weight: 1 },
        { from: 2, to: 1, weight: 2 },
        { from: 1, to: 3, weight: 1 },
        { from: 2, to: 3, weight: 5 },
        { from: 3, to: 4, weight: 3 },
        { from: 1, to: 4, weight: 10 },
    ];
    const g: Graph = { n: 5, edges };
    const terminals = [0, 3, 4];
    const pres = distancePreserver(g, terminals);
    // All distances between terminals must stay exact
    const origDist = allPairsShortestDistances(g);
    const presDist = allPairsShortestDistances(pres);
    for (const s of terminals) {
        for (const t of terminals) {
            if (s === t) continue;
            assert(
                approxEqual(origDist[s][t], presDist[s][t]),
                `Preserver altered distance ${s}→${t}`
            );
        }
    }
})();

console.log("All tests passed successfully.");
