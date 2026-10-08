export type NodeId = string;

export interface Edge {
    from: NodeId;
    to: NodeId;
    capacity: number;
}

export class Graph {
    nodes: Set<NodeId>;
    adj: Map<NodeId, Edge[]>;

    constructor(edges: Edge[]) {
        this.nodes = new Set();
        this.adj = new Map();
        for (const e of edges) {
            this.nodes.add(e.from);
            this.nodes.add(e.to);
            if (!this.adj.has(e.from)) this.adj.set(e.from, []);
            this.adj.get(e.from)!.push({ ...e });
        }
    }

    // Deep copy of adjacency list (used for flow algorithms)
    cloneAdj(): Map<NodeId, Edge[]> {
        const newAdj = new Map<NodeId, Edge[]>();
        for (const [u, edges] of this.adj.entries()) {
            newAdj.set(u, edges.map(e => ({ ...e })));
        }
        return newAdj;
    }
}

/**
 * Edmonds‑Karp implementation for a single source‑sink max flow.
 * Returns the maximum flow value.
 */
export function maxFlow(g: Graph, source: NodeId, sink: NodeId): number {
    const residual = g.cloneAdj();

    const bfs = (): Map<NodeId, Edge | null> => {
        const parent = new Map<NodeId, Edge | null>();
        const visited = new Set<NodeId>();
        const queue: NodeId[] = [];
        queue.push(source);
        visited.add(source);
        parent.set(source, null);
        while (queue.length) {
            const u = queue.shift()!;
            const edges = residual.get(u) ?? [];
            for (const e of edges) {
                if (e.capacity > 0 && !visited.has(e.to)) {
                    visited.add(e.to);
                    parent.set(e.to, e);
                    if (e.to === sink) return parent;
                    queue.push(e.to);
                }
            }
        }
        return parent;
    };

    let flow = 0;
    while (true) {
        const parent = bfs();
        if (!parent.has(sink)) break;

        // find bottleneck
        let pathCap = Infinity;
        let v: NodeId | undefined = sink;
        while (v !== source) {
            const e = parent.get(v)!;
            pathCap = Math.min(pathCap, e.capacity);
            v = e.from;
        }

        // augment
        v = sink;
        while (v !== source) {
            const e = parent.get(v)!;
            // decrease forward edge
            e.capacity -= pathCap;
            // increase reverse edge
            let revList = residual.get(e.to);
            if (!revList) {
                revList = [];
                residual.set(e.to, revList);
            }
            const revEdge = revList.find(re => re.to === e.from);
            if (revEdge) {
                revEdge.capacity += pathCap;
            } else {
                revList.push({ from: e.to, to: e.from, capacity: pathCap });
            }
            v = e.from;
        }
        flow += pathCap;
    }
    return flow;
}

/**
 * Finds all simple paths (no repeated nodes) from source to sink.
 * Used for brute‑force edge‑disjoint routing on tiny graphs.
 */
function allSimplePaths(g: Graph, source: NodeId, sink: NodeId, limit = 10): NodeId[][] {
    const paths: NodeId[][] = [];
    const visited = new Set<NodeId>();

    const dfs = (u: NodeId, path: NodeId[]) => {
        if (path.length > limit) return;
        if (u === sink) {
            paths.push([...path]);
            return;
        }
        visited.add(u);
        const edges = g.adj.get(u) ?? [];
        for (const e of edges) {
            if (e.capacity > 0 && !visited.has(e.to)) {
                path.push(e.to);
                dfs(e.to, path);
                path.pop();
            }
        }
        visited.delete(u);
    };

    dfs(source, [source]);
    return paths;
}

/**
 * Computes the maximum number of source‑sink pairs that can simultaneously
 * route one unit each using edge‑disjoint paths (unit capacities).
 * Brute‑forces all path selections; suitable only for very small graphs.
 */
export function maxEdgeDisjointRouting(g: Graph, pairs: [NodeId, NodeId][]): number {
    // Pre‑compute all candidate paths for each pair
    const candidatePaths: NodeId[][][] = pairs.map(([s, t]) => allSimplePaths(g, s, t));

    let best = 0;
    const usedEdges = new Set<string>();

    const backtrack = (idx: number, routed: number) => {
        if (idx === pairs.length) {
            best = Math.max(best, routed);
            return;
        }
        // Option: skip this pair
        backtrack(idx + 1, routed);

        // Try each path for this pair
        for (const path of candidatePaths[idx]) {
            const edgesInPath = [];
            let conflict = false;
            for (let i = 0; i < path.length - 1; i++) {
                const key = `${path[i]}->${path[i + 1]}`;
                if (usedEdges.has(key)) {
                    conflict = true;
                    break;
                }
                edgesInPath.push(key);
            }
            if (conflict) continue;
            // Mark edges
            for (const e of edgesInPath) usedEdges.add(e);
            backtrack(idx + 1, routed + 1);
            // Unmark
            for (const e of edgesInPath) usedEdges.delete(e);
        }
    };

    backtrack(0, 0);
    return best;
}

/**
 * Constructs the classic counterexample network where routing is limited
 * to 1 unit but coding (sum of individual max flows) reaches 2 units.
 */
export function buildCounterexample(): { graph: Graph; pairs: [NodeId, NodeId][] } {
    const edges: Edge[] = [
        { from: 's1', to: 'm', capacity: 1 },
        { from: 's2', to: 'm', capacity: 1 },
        { from: 'm', to: 'c', capacity: 1 }, // shared bottleneck
        { from: 'c', to: 't1', capacity: 1 },
        { from: 'c', to: 't2', capacity: 1 },
    ];
    const graph = new Graph(edges);
    const pairs: [NodeId, NodeId][] = [
        ['s1', 't1'],
        ['s2', 't2'],
    ];
    return { graph, pairs };
}

/**
 * Computes the "coding capacity" as the sum of individual max flows,
 * ignoring interference between pairs.
 */
export function codingCapacity(g: Graph, pairs: [NodeId, NodeId][]): number {
    let total = 0;
    for (const [s, t] of pairs) {
        total += maxFlow(g, s, t);
    }
    return total;
}
