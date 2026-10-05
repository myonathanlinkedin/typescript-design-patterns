import { Graph, buildGraph } from "./types";
import { maximalIndependentSetSize, generateRandomGraph } from "./engine";

/**
 * Simple assertion helper. Throws an error when condition is false.
 *
 * @param condition Boolean condition to assert.
 * @param message Optional error message.
 */
function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

/* ---------- Unit Tests ---------- */

// Test 1: Empty graph
(() => {
  const g: Graph = { nodes: new Set(), adjacency: new Map() };
  const size = maximalIndependentSetSize(g);
  assert(size === 0, "Empty graph should have MIS size 0");
})();

// Test 2: Single node
(() => {
  const g = buildGraph([]);
  // Manually add isolated node 0
  g.nodes.add(0);
  g.adjacency.set(0, new Set());
  const size = maximalIndependentSetSize(g);
  assert(size === 1, "Single isolated node should have MIS size 1");
})();

// Test 3: Complete graph K_n (n=5)
(() => {
  const n = 5;
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < n; ++i) {
    for (let j = i + 1; j < n; ++j) {
      edges.push([i, j]);
    }
  }
  const g = buildGraph(edges);
  const size = maximalIndependentSetSize(g);
  assert(size === 1, "Complete graph should have MIS size 1");
})();

// Test 4: Path graph P_4 (0-1-2-3)
(() => {
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
  ];
  const g = buildGraph(edges);
  const size = maximalIndependentSetSize(g);
  // Greedy picks 0, then 2, resulting in size 2 (optimal for path of length 4)
  assert(size === 2, "Path graph P_4 should have MIS size 2");
})();

// Test 5: Cycle graph C_5 (odd cycle)
(() => {
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 0],
  ];
  const g = buildGraph(edges);
  const size = maximalIndependentSetSize(g);
  // Greedy on ordered nodes yields MIS {0,2,4} size 3, which is optimal for odd cycle
  assert(size === 3, "Cycle C_5 should have MIS size 3");
})();

// Test 6: Disconnected graph (two triangles)
(() => {
  const edges: Array<[number, number]> = [
    // Triangle 1: 0-1-2-0
    [0, 1],
    [1, 2],
    [2, 0],
    // Triangle 2: 3-4-5-3
    [3, 4],
    [4, 5],
    [5, 3],
  ];
  const g = buildGraph(edges);
  const size = maximalIndependentSetSize(g);
  // Each triangle contributes exactly 1 node to MIS => total 2
  assert(size === 2, "Two disconnected triangles should have MIS size 2");
})();

/* ---------- Demo ---------- */
(() => {
  const n = 20;
  const p = 0.15;
  const rng = (() => {
    // Simple deterministic RNG (Linear Congruential Generator)
    let seed = 123456789;
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
  })();

  const randomGraph = generateRandomGraph(n, p, rng);
  const misSize = maximalIndependentSetSize(randomGraph);
  console.log("Random Graph Demo:");
  console.log(`Vertices: ${n}, Edge probability: ${p}`);
  console.log(`MIS size (greedy maximal): ${misSize}`);
})();

console.log("All unit tests passed.");
