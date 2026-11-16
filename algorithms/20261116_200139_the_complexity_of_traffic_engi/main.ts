import { Graph, Edge, Demand } from "./types";
import { computeTrafficEngineering, shortestPath, segmentRoutingPath } from "./engine";
import * as assert from "assert";

/**
 * Helper to build a directed graph from edge list.
 */
function buildGraph(edges: Edge[]): Graph {
    const nodes = new Set<string | number>();
    const adjacency = new Map<string | number, Edge[]>();
    for (const e of edges) {
        nodes.add(e.from);
        nodes.add(e.to);
        if (!adjacency.has(e.from)) adjacency.set(e.from, []);
        adjacency.get(e.from)!.push(e);
    }
    // Ensure every node appears in adjacency map (even if no outgoing edges)
    for (const n of nodes) {
        if (!adjacency.has(n)) adjacency.set(n, []);
    }
    return { nodes, adjacency };
}

/* ==========================
   Unit Tests
   ========================== */
function runTests() {
    // Test 1: Simple triangle graph
    const edges1: Edge[] = [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 1 },
        { from: "A", to: "C", weight: 3 },
    ];
    const g1 = buildGraph(edges1);
    const pathAB = shortestPath(g1, "A", "B");
    assert.deepStrictEqual(pathAB, ["A", "B"], "Shortest path A→B should be direct");

    const pathAC = shortestPath(g1, "A", "C");
    assert.deepStrictEqual(pathAC, ["A", "B", "C"], "Shortest path A→C should go via B");

    const srAC = segmentRoutingPath(g1, "A", "C");
    assert.deepStrictEqual(srAC.path, ["A", "B", "C"], "SR path matches shortest path");
    assert.deepStrictEqual(srAC.segments, ["B"], "Segment list contains intermediate node B");
    assert.strictEqual(srAC.cost, 2, "Total cost should be 2 (1+1)");

    // Test 2: Disconnected nodes
    const edges2: Edge[] = [
        { from: 1, to: 2, weight: 5 },
        { from: 2, to: 3, weight: 5 },
    ];
    const g2 = buildGraph(edges2);
    const path13 = shortestPath(g2, 1, 3);
    assert.deepStrictEqual(path13, [1, 2, 3], "Path 1→3 exists via 2");

    const path31 = shortestPath(g2, 3, 1);
    assert.deepStrictEqual(path31, [], "No path from 3 to 1 (directed graph)");

    // Test 3: Zero‑volume demand should not affect total cost
    const demands3: Demand[] = [
        { source: "A", destination: "C", volume: 10 },
        { source: "A", destination: "B", volume: 0 },
    ];
    const { results: res3, totalCost: total3 } = computeTrafficEngineering(g1, demands3);
    const costAtoC = res3.find(r => r.demand.destination === "C")!.cost;
    const costAtoB = res3.find(r => r.demand.destination === "B")!.cost;
    assert.strictEqual(costAtoC, 2, "Cost A→C is 2");
    assert.strictEqual(costAtoB, 1, "Cost A→B is 1");
    assert.strictEqual(total3, 2 * 10 + 1 * 0, "Total cost respects traffic volume");

    // Test 4: Self‑demand (source == destination)
    const demands4: Demand[] = [{ source: "A", destination: "A", volume: 5 }];
    const { results: res4, totalCost: total4 } = computeTrafficEngineering(g1, demands4);
    assert.deepStrictEqual(res4[0].path, ["A"], "Self‑path should be single node");
    assert.deepStrictEqual(res4[0].segmentList, [], "No segments for self‑path");
    assert.strictEqual(res4[0].cost, 0, "Zero cost for self‑path");
    assert.strictEqual(total4, 0, "Total cost zero for zero‑length path");

    console.log("All unit tests passed.");
}

/* ==========================
   Demo Execution
   ========================== */
function demo() {
    // Build a modest network
    const edges: Edge[] = [
        { from: "S", to: "A", weight: 2 },
        { from: "S", to: "B", weight: 5 },
        { from: "A", to: "B", weight: 2 },
        { from: "A", to: "C", weight: 4 },
        { from: "B", to: "C", weight: 1 },
        { from: "C", to: "D", weight: 3 },
        { from: "B", to: "D", weight: 7 },
    ];
    const graph = buildGraph(edges);

    const demands: Demand[] = [
        { source: "S", destination: "D", volume: 100 },
        { source: "A", destination: "D", volume: 50 },
        { source: "B", destination: "C", volume: 30 },
    ];

    const { results, totalCost } = computeTrafficEngineering(graph, demands);
    console.log("Traffic Engineering Results:");
    for (const r of results) {
        console.log(`Demand ${r.demand.source}→${r.demand.destination} (vol=${r.demand.volume})`);
        console.log(`  Path: ${r.path.join(" → ")}`);
        console.log(`  Segments: ${r.segmentList.join(", ") || "(none)"}`);
        console.log(`  Path cost: ${r.cost}`);
        console.log(`  Weighted cost: ${r.cost * r.demand.volume}`);
    }
    console.log(`Aggregate network cost: ${totalCost}`);
}

// Execute tests then demo
runTests();
demo();
