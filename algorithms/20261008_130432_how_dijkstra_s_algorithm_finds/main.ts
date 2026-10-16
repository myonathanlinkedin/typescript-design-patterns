import { dijkstra, Graph } from "./core";

function assert(condition: boolean, message?: string): void {
  if (!condition) throw new Error(message ?? "Assertion failed");
}

// Helper to build a graph from adjacency list literals
function buildGraph(adj: Record<string, Array<[string, number]>>): Graph {
  const g: Graph = new Map();
  for (const [node, edges] of Object.entries(adj)) {
    g.set(node, edges.map(([to, w]) => ({ to, weight: w })));
    // Ensure all target nodes exist in the map (even if isolated)
    for (const [to] of edges) {
      if (!g.has(to)) g.set(to, []);
    }
  }
  return g;
}

// ----- Unit Tests -----
function testSimpleTriangle(): void {
  const g = buildGraph({
    A: [["B", 1], ["C", 4]],
    B: [["C", 2]],
    C: [],
  });
  const { distances, previous } = dijkstra(g, "A");
  assert(distances.get("C") === 3, "A->C should be 3");
  assert(previous.get("C") === "B", "Predecessor of C should be B");
  assert(previous.get("B") === "A", "Predecessor of B should be A");
}

function testDisconnectedNode(): void {
  const g = buildGraph({
    X: [["Y", 5]],
    Y: [],
    Z: [], // isolated
  });
  const { distances } = dijkstra(g, "X");
  assert(distances.get("Z") === Infinity, "Z should be unreachable");
}

function testSingleNode(): void {
  const g = buildGraph({ Solo: [] });
  const { distances, previous } = dijkstra(g, "Solo");
  assert(distances.get("Solo") === 0, "Distance to self is zero");
  assert(previous.get("Solo") === null, "No predecessor for source");
}

function testNegativeWeight(): void {
  const g = buildGraph({
    P: [["Q", -1]],
    Q: [],
  });
  let caught = false;
  try {
    dijkstra(g, "P");
  } catch (e) {
    caught = true;
  }
  assert(caught, "Algorithm must reject negative weights");
}

function testMultipleEqualPaths(): void {
  const g = buildGraph({
    S: [["A", 1], ["B", 1]],
    A: [["T", 2]],
    B: [["T", 2]],
    T: [],
  });
  const { distances, previous } = dijkstra(g, "S");
  assert(distances.get("T") === 3, "Shortest distance S->T should be 3");
  // Predecessor can be either A or B; verify distance consistency
  const pred = previous.get("T");
  assert(pred === "A" || pred === "B", "Predecessor of T should be A or B");
}

// Run all tests
function runTests(): void {
  const tests = [
    testSimpleTriangle,
    testDisconnectedNode,
    testSingleNode,
    testNegativeWeight,
    testMultipleEqualPaths,
  ];
  for (const t of tests) {
    t();
  }
  console.log("All unit tests passed.");
}

// ----- Simple Benchmark -----
function benchmark(): void {
  const NODE_COUNT = 1000;
  const EDGE_PER_NODE = 5;
  const g: Graph = new Map();

  // Initialize nodes
  for (let i = 0; i < NODE_COUNT; i++) {
    g.set(i.toString(), []);
  }

  // Random edges
  for (let i = 0; i < NODE_COUNT; i++) {
    const edges: Array<[string, number]> = [];
    for (let e = 0; e < EDGE_PER_NODE; e++) {
      const target = Math.floor(Math.random() * NODE_COUNT).toString();
      const weight = Math.floor(Math.random() * 10) + 1;
      edges.push([target, weight]);
    }
    g.set(i.toString(), edges.map(([to, w]) => ({ to, weight: w })));
  }

  const { performance } = require("perf_hooks");
  const start = performance.now();
  dijkstra(g, "0");
  const end = performance.now();
  console.log(`Benchmark: Dijkstra on ${NODE_COUNT} nodes took ${(end - start).toFixed(2)} ms`);
}

// ----- Entry Point -----
function main(): void {
  runTests();
  benchmark();
}

main();
