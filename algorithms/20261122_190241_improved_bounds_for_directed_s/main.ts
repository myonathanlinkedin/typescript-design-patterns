import { SsspSolver, Edge } from "./core";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function buildGraph(n: number, edges: [number, number, number][]): Edge[][] {
  const adj: Edge[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push({ to: v, weight: w });
  }
  return adj;
}

function testSparseGraph(): void {
  // Sparse graph: 5 nodes, 6 edges
  const edges: [number, number, number][] = [
    [0, 1, 4],
    [0, 2, 1],
    [2, 1, 2],
    [1, 3, 1],
    [2, 3, 5],
    [3, 4, 3],
  ];
  const solver = new SsspSolver(5, buildGraph(5, edges));
  assert(solver.isSparse(), "Graph should be sparse");
  const result = solver.solve(0);
  assert(result.dist[0] === 0, "dist[0] should be 0");
  assert(result.dist[1] === 3, "dist[1] should be 3 (0->2->1)");
  assert(result.dist[2] === 1, "dist[2] should be 1");
  assert(result.dist[3] === 4, "dist[3] should be 4 (0->2->1->3)");
  assert(result.dist[4] === 7, "dist[4] should be 7 (0->2->1->3->4)");
  assert(result.pred[1] === 2, "pred[1] should be 2");
  assert(result.pred[3] === 1, "pred[3] should be 1");
  console.log("✓ Sparse graph test passed");
}

function testDenseGraph(): void {
  // Dense graph: 4 nodes, 12 edges (complete directed)
  const edges: [number, number, number][] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (i !== j) {
        edges.push([i, j, (i + j + 1) % 5 + 1]);
      }
    }
  }
  const solver = new SsspSolver(4, buildGraph(4, edges));
  assert(!solver.isSparse(), "Graph should be dense");
  const result = solver.solve(0);
  assert(result.dist[0] === 0, "dist[0] should be 0");
  // Verify all distances are finite
  for (let i = 1; i < 4; i++) {
    assert(result.dist[i] < Infinity, `dist[${i}] should be finite`);
  }
  console.log("✓ Dense graph test passed");
}

function testSingleNode(): void {
  const solver = new SsspSolver(1, [[]]);
  const result = solver.solve(0);
  assert(result.dist[0] === 0, "Single node dist should be 0");
  assert(result.pred[0] === -1, "Single node pred should be -1");
  console.log("✓ Single node test passed");
}

function testDisconnected(): void {
  // Two disconnected components
  const edges: [number, number, number][] = [
    [0, 1, 2],
    [2, 3, 3],
  ];
  const solver = new SsspSolver(4, buildGraph(4, edges));
  const result = solver.solve(0);
  assert(result.dist[0] === 0, "dist[0] should be 0");
  assert(result.dist[1] === 2, "dist[1] should be 2");
  assert(result.dist[2] === Infinity, "dist[2] should be Infinity");
  assert(result.dist[3] === Infinity, "dist[3] should be Infinity");
  console.log("✓ Disconnected graph test passed");
}

function testZeroWeightEdges(): void {
  const edges: [number, number, number][] = [
    [0, 1, 0],
    [1, 2, 0],
    [0, 2, 5],
  ];
  const solver = new SsspSolver(3, buildGraph(3, edges));
  const result = solver.solve(0);
  assert(result.dist[0] === 0, "dist[0] should be 0");
  assert(result.dist[1] === 0, "dist[1] should be 0");
  assert(result.dist[2] === 0, "dist[2] should be 0 (via zero-weight path)");
  console.log("✓ Zero-weight edges test passed");
}

function testInvalidSource(): void {
  const solver = new SsspSolver(3, buildGraph(3, [[0, 1, 1]]));
  let threw = false;
  try {
    solver.solve(-1);
  } catch (e) {
    threw = true;
  }
  assert(threw, "Should throw for invalid source");
  console.log("✓ Invalid source test passed");
}

function testLargeSparseGraph(): void {
  // 1000 nodes, 2000 edges (sparse)
  const n = 1000;
  const edges: [number, number, number][] = [];
  for (let i = 0; i < n - 1; i++) {
    edges.push([i, i + 1, 1]);
  }
  for (let i = 0; i < 1000; i++) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    if (u !== v) {
      edges.push([u, v, Math.floor(Math.random() * 10) + 1]);
    }
  }
  const solver = new SsspSolver(n, buildGraph(n, edges));
  assert(solver.isSparse(), "Large graph should be sparse");
  const result = solver.solve(0);
  assert(result.dist[0] === 0, "dist[0] should be 0");
  assert(result.dist[n - 1] < Infinity, "dist[n-1] should be finite");
  console.log("✓ Large sparse graph test passed");
}

function main(): void {
  console.log("=== SSSP Algorithm Test Suite ===\n");
  testSparseGraph();
  testDenseGraph();
  testSingleNode();
  testDisconnected();
  testZeroWeightEdges();
  testInvalidSource();
  testLargeSparseGraph();
  console.log("\n✓ All tests passed!");
}

main();
