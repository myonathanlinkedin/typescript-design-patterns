import { Graph, Edge } from "./types";
import { dijkstra, reconstructPath } from "./engine";
import * as assert from "assert";

/**
 * Helper to build a graph from an edge list.
 */
function buildGraph(edges: Edge[]): Graph {
    const nodes = new Set<NodeId>();
    const adjacency = new Map<NodeId, Edge[]>();
    for (const e of edges) {
        nodes.add(e.from);
        nodes.add(e.to);
        if (!adjacency.has(e.from)) adjacency.set(e.from, []);
        adjacency.get(e.from)!.push(e);
    }
    // Ensure isolated nodes have an entry in adjacency map
    for (const n of nodes) {
        if (!adjacency.has(n)) adjacency.set(n, []);
    }
    return { nodes, adjacency };
}

/* ---------- Unit Tests ---------- */

// Simple weighted graph (undirected represented as two directed edges)
const edges: Edge[] = [
    { from: "A", to: "B", weight: 4 },
    { from: "B", to: "A", weight: 4 },

    { from: "A", to: "C", weight: 2 },
    { from: "C", to: "A", weight: 2 },

    { from: "B", to: "C", weight: 1 },
    { from: "C", to: "B", weight: 1 },

    { from: "B", to: "D", weight: 5 },
    { from: "D", to: "B", weight: 5 },

    { from: "C", to: "D", weight: 8 },
    { from: "D", to: "C", weight: 8 },

    { from: "C", to: "E", weight: 10 },
    { from: "E", to: "C", weight: 10 },

    { from: "D", to: "E", weight: 2 },
    { from: "E", to: "D", weight: 2 },

    { from: "D", to: "Z", weight: 6 },
    { from: "Z", to: "D", weight: 6 },

    { from: "E", to: "Z", weight: 3 },
    { from: "Z", to: "E", weight: 3 },
];

const graph = buildGraph(edges);

// Test 1: distances from A
const resultA = dijkstra(graph, "A");
assert.strictEqual(resultA.distances.get("A"), 0);
assert.strictEqual(resultA.distances.get("B"), 3); // A->C->B
assert.strictEqual(resultA.distances.get("C"), 2);
assert.strictEqual(resultA.distances.get("D"), 9); // A->C->B->D (3+5) or A->C->E->D (2+10+2) -> 9 is optimal
assert.strictEqual(resultA.distances.get("E"), 11); // A->C->B->D->E (3+5+2)
assert.strictEqual(resultA.distances.get("Z"), 14); // A->C->B->D->Z (3+5+6)

// Test path reconstruction
const pathAtoZ = reconstructPath(resultA.previous, "A", "Z");
assert.deepStrictEqual(pathAtoZ, ["A", "C", "B", "D", "Z"]);

// Test 2: source node with no outgoing edges (isolated)
const isolatedEdges: Edge[] = [
    { from: 1, to: 2, weight: 7 },
    { from: 2, to: 3, weight: 5 },
];
const isolatedGraph = buildGraph(isolatedEdges);
isolatedGraph.nodes.add(99); // isolated node
if (!isolatedGraph.adjacency.has(99)) isolatedGraph.adjacency.set(99, []);

// Run Dijkstra from isolated node
const resultIso = dijkstra(isolatedGraph, 99);
assert.strictEqual(resultIso.distances.get(99), 0);
assert.strictEqual(resultIso.distances.get(1), Infinity);
assert.deepStrictEqual(reconstructPath(resultIso.previous, 99, 1), []);

// Test 3: single‑node graph
const singleNodeGraph: Graph = {
    nodes: new Set([ "X" ]),
    adjacency: new Map([ [ "X", [] ] ]),
};
const resultSingle = dijkstra(singleNodeGraph, "X");
assert.strictEqual(resultSingle.distances.get("X"), 0);
assert.deepStrictEqual(reconstructPath(resultSingle.previous, "X", "X"), ["X"]);

// Test 4: negative weight detection
const negativeEdges: Edge[] = [
    { from: "S", to: "T", weight: -1 },
];
const negativeGraph = buildGraph(negativeEdges);
let negativeCaught = false;
try {
    dijkstra(negativeGraph, "S");
} catch (e) {
    negativeCaught = true;
    assert.ok((e as Error).message.includes("negative"));
}
assert.ok(negativeCaught, "Algorithm should reject negative edge weights");

// Test 5: source node not present
let missingSourceCaught = false;
try {
    dijkstra(graph, "NON_EXISTENT");
} catch (e) {
    missingSourceCaught = true;
    assert.ok((e as Error).message.includes("does not exist"));
}
assert.ok(missingSourceCaught, "Algorithm should error on missing source");

// ---------- Demo ----------
console.log("=== Dijkstra Demo ===");
const demoResult = dijkstra(graph, "A");
for (const node of graph.nodes) {
    const dist = demoResult.distances.get(node);
    const path = reconstructPath(demoResult.previous, "A", node);
    console.log(`A → ${node}: distance=${dist}, path=${path.join(" -> ")}`);
}
console.log("All tests passed.");
