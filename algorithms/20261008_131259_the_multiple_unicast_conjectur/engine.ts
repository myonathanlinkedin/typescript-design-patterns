import { Graph, Edge, FlowResult, NodeId } from "./types";

/**
 * Build an adjacency map from a graph for quick lookup.
 */
function buildAdjacency(graph: Graph): Map<NodeId, Edge[]> {
    const adj = new Map<NodeId, Edge[]>();
    for (const n of graph.nodes) {
        adj.set(n, []);
    }
    for (const e of graph.edges) {
        adj.get(e.from)!.push(e);
    }
    return adj;
}

/**
 * Breadth‑first search on the residual network.
 * Returns a map of predecessors (node → edge) if a path exists, otherwise undefined.
 */
function bfsResidual(
    residual: Map<string, number>,
    source: NodeId,
    sink: NodeId,
    nodes: Set<NodeId>
): Map<NodeId, Edge> | undefined {
    const queue: NodeId[] = [];
    const visited = new Set<NodeId>();
    const pred = new Map<NodeId, Edge>();

    queue.push(source);
    visited.add(source);

    while (queue.length > 0) {
        const u = queue.shift()!;
        for (const v of nodes) {
            const key = `${u}->${v}`;
            const cap = residual.get(key) ?? 0;
            if (cap > 0 && !visited.has(v)) {
                visited.add(v);
                // store the forward edge that leads to v
                pred.set(v, { from: u, to: v, capacity: cap });
                if (v === sink) {
                    return pred;
                }
                queue.push(v);
            }
        }
    }
    return undefined;
}

/**
 * Edmonds‑Karp implementation for a single source‑sink pair.
 */
export function maxFlow(graph: Graph, source: NodeId, sink: NodeId): number {
    // Initialise residual capacities
    const residual = new Map<string, number>();
    for (const e of graph.edges) {
        const key = `${e.from}->${e.to}`;
        residual.set(key, e.capacity);
        // reverse edge initially 0 capacity
        const revKey = `${e.to}->${e.from}`;
        if (!residual.has(revKey)) residual.set(revKey, 0);
    }

    let maxFlow = 0;

    while (true) {
        const pred = bfsResidual(residual, source, sink, graph.nodes);
        if (!pred) break; // no augmenting path

        // Determine bottleneck capacity on the found path
        let pathCap = Infinity;
        let v = sink;
        while (v !== source) {
            const edge = pred.get(v)!;
            pathCap = Math.min(pathCap, residual.get(`${edge.from}->${edge.to}`)!);
            v = edge.from;
        }

        // Augment flow along the path
        v = sink;
        while (v !== source) {
            const edge = pred.get(v)!;
            const fwdKey = `${edge.from}->${edge.to}`;
            const revKey = `${edge.to}->${edge.from}`;
            residual.set(fwdKey, residual.get(fwdKey)! - pathCap);
            residual.set(revKey, residual.get(revKey)! + pathCap);
            v = edge.from;
        }

        maxFlow += pathCap;
    }

    return maxFlow;
}

/**
 * Greedy edge‑disjoint path finder for a set of source‑sink pairs.
 * Returns the maximum number of pairs that can be simultaneously routed
 * using simple first‑fit ordering.
 */
export function maxSimultaneousEdgeDisjointPaths(
    graph: Graph,
    pairs: [NodeId, NodeId][]
): number {
    // Copy edges because we will consume capacities
    const capacity = new Map<string, number>();
    for (const e of graph.edges) {
        const key = `${e.from}->${e.to}`;
        capacity.set(key, e.capacity);
    }

    let successCount = 0;

    // Try each pair in the given order
    for (const [src, dst] of pairs) {
        // BFS respecting remaining capacities
        const queue: NodeId[] = [];
        const visited = new Set<NodeId>();
        const pred = new Map<NodeId, NodeId>();

        queue.push(src);
        visited.add(src);
        let found = false;

        while (queue.length > 0 && !found) {
            const u = queue.shift()!;
            for (const e of graph.edges) {
                if (e.from !== u) continue;
                const key = `${e.from}->${e.to}`;
                if ((capacity.get(key) ?? 0) <= 0) continue; // no residual capacity
                const v = e.to;
                if (visited.has(v)) continue;
                visited.add(v);
                pred.set(v, u);
                if (v === dst) {
                    found = true;
                    break;
                }
                queue.push(v);
            }
        }

        if (!found) continue; // cannot route this pair

        // Reconstruct path and consume one unit of capacity on each edge
        let cur = dst;
        while (cur !== src) {
            const prev = pred.get(cur)!;
            const key = `${prev}->${cur}`;
            capacity.set(key, (capacity.get(key) ?? 0) - 1);
            cur = prev;
        }
        successCount++;
    }

    return successCount;
}
