import { Graph, Edge } from "./types";
import { maxFlow, maxSimultaneousEdgeDisjointPaths } from "./engine";

/**
 * Simple assertion helper.
 */
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/**
 * Construct the classic butterfly network (capacity 1 per edge).
 *
 * Nodes: s1, s2, a, b, c, t1, t2
 * Edges:
 *   s1→a, s1→b,
 *   s2→a, s2→b,
 *   a→c,
 *   b→c,
 *   c→t1,
 *   c→t2
 *
 * Two unicast sessions:
 *   (s1, t1) and (s2, t2)
 *
 * Individually each session can achieve flow 1.
 * Simultaneously, routing can achieve at most 1 because edge a→c and b→c
 * converge on the single bottleneck c→t* edges (capacity 1 each, but they share
 * the incoming edge c which has capacity 1). The greedy edge‑disjoint algorithm
 * will find only one path.
 */
function buildButterflyGraph(): Graph {
    const nodes = new Set<NodeId>([
        "s1", "s2", "a", "b", "c", "t1", "t2"
    ]);

    const edges: Edge[] = [
        { from: "s1", to: "a", capacity: 1 },
        { from: "s1", to: "b", capacity: 1 },
        { from: "s2", to: "a", capacity: 1 },
        { from: "s2", to: "b", capacity: 1 },
        { from: "a",  to: "c", capacity: 1 },
        { from: "b",  to: "c", capacity: 1 },
        { from: "c",  to: "t1", capacity: 1 },
        { from: "c",  to: "t2", capacity: 1 }
    ];

    return { nodes, edges };
}

// Unit tests
function runTests(): void {
    const g = buildButterflyGraph();

    // Individual max‑flows
    const flow1 = maxFlow(g, "s1", "t1");
    const flow2 = maxFlow(g, "s2", "t2");
    assert(flow1 === 1, `Expected max flow s1→t1 = 1, got ${flow1}`);
    assert(flow2 === 1, `Expected max flow s2→t2 = 1, got ${flow2}`);

    // Sum of individual capacities (cut‑set bound)
    const cutBound = flow1 + flow2;
    assert(cutBound === 2, `Expected cut bound = 2, got ${cutBound}`);

    // Simultaneous routing using edge‑disjoint paths
    const simultaneous = maxSimultaneousEdgeDisjointPaths(g, [
        ["s1", "t1"],
        ["s2", "t2"]
    ]);
    assert(simultaneous === 1, `Expected simultaneous edge‑disjoint paths = 1, got ${simultaneous}`);

    // Demonstrate falseness of the Multiple Unicast Conjecture (routing version)
    assert(
        simultaneous < cutBound,
        "Multiple Unicast Conjecture (routing) is violated: simultaneous < cut bound"
    );

    // Edge‑case: empty graph
    const emptyGraph: Graph = { nodes: new Set(), edges: [] };
    const emptyFlow = maxFlow(emptyGraph, "x", "y");
    assert(emptyFlow === 0, "Empty graph should yield zero flow");

    // Edge‑case: disconnected pair
    const disconnectedGraph: Graph = {
        nodes: new Set(["u", "v"]),
        edges: [] // no edges
    };
    const discFlow = maxFlow(disconnectedGraph, "u", "v");
    assert(discFlow === 0, "Disconnected pair should yield zero flow");

    console.log("All tests passed.");
}

// Execute tests when the module is run directly
runTests();
