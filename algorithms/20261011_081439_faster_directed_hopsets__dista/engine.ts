import { Edge, Graph, HopDistance } from "./types";

/**
 * Build an adjacency list for fast look‑ups.
 */
function buildAdjacency(graph: Graph): Map<number, Edge[]> {
    const adj = new Map<number, Edge[]>();
    for (let i = 0; i < graph.n; ++i) adj.set(i, []);
    for (const e of graph.edges) {
        adj.get(e.from)!.push(e);
    }
    return adj;
}

/**
 * Dijkstra’s algorithm limited to a maximum number of hops.
 * Returns the shortest distance and the hop count for every vertex.
 * If a vertex cannot be reached within maxHops, its distance stays +Infinity.
 */
export function dijkstraLimitedHops(
    graph: Graph,
    source: number,
    maxHops: number
): HopDistance[] {
    const adj = buildAdjacency(graph);
    const INF = Number.POSITIVE_INFINITY;
    const dist: number[] = new Array(graph.n).fill(INF);
    const hops: number[] = new Array(graph.n).fill(Infinity);
    dist[source] = 0;
    hops[source] = 0;

    // priority queue element
    type PQItem = { v: number; d: number; h: number };
    const pq: PQItem[] = [{ v: source, d: 0, h: 0 }];

    // simple binary heap implementation (min‑heap on distance)
    const heapPush = (item: PQItem) => {
        pq.push(item);
        let i = pq.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (pq[p].d <= pq[i].d) break;
            [pq[p], pq[i]] = [pq[i], pq[p]];
            i = p;
        }
    };
    const heapPop = (): PQItem | undefined => {
        if (pq.length === 0) return undefined;
        const top = pq[0];
        const last = pq.pop()!;
        if (pq.length > 0) {
            pq[0] = last;
            // heapify down
            let i = 0;
            while (true) {
                let l = i * 2 + 1;
                let r = l + 1;
                let smallest = i;
                if (l < pq.length && pq[l].d < pq[smallest].d) smallest = l;
                if (r < pq.length && pq[r].d < pq[smallest].d) smallest = r;
                if (smallest === i) break;
                [pq[i], pq[smallest]] = [pq[smallest], pq[i]];
                i = smallest;
            }
        }
        return top;
    };

    heapPush({ v: source, d: 0, h: 0 });

    while (true) {
        const cur = heapPop();
        if (!cur) break;
        const { v, d, h } = cur;
        if (d > dist[v]) continue; // stale entry
        if (h === maxHops) continue; // cannot extend further

        for (const e of adj.get(v)!) {
            const nd = d + e.weight;
            const nh = h + 1;
            if (nd < dist[e.to] || (nd === dist[e.to] && nh < hops[e.to])) {
                dist[e.to] = nd;
                hops[e.to] = nh;
                heapPush({ v: e.to, d: nd, h: nh });
            }
        }
    }

    const result: HopDistance[] = [];
    for (let i = 0; i < graph.n; ++i) {
        result.push({ distance: dist[i], hops: hops[i] });
    }
    return result;
}

/**
 * Deterministic shortcut set construction.
 * For every ordered pair (u, v) whose shortest‑path hop count exceeds maxHops,
 * we add a direct edge (u, v) with weight equal to the exact shortest distance.
 * The returned graph is a new instance containing original edges plus shortcuts.
 */
export function addDeterministicShortcuts(
    graph: Graph,
    maxHops: number
): Graph {
    const shortcuts: Edge[] = [];

    for (let u = 0; u < graph.n; ++u) {
        const hd = dijkstraLimitedHops(graph, u, maxHops);
        for (let v = 0; v < graph.n; ++v) {
            if (u === v) continue;
            if (hd[v].hops > maxHops) {
                // Need a shortcut
                shortcuts.push({ from: u, to: v, weight: hd[v].distance });
            }
        }
    }

    return {
        n: graph.n,
        edges: graph.edges.concat(shortcuts),
    };
}

/**
 * Exact distance preserver for a given set of terminal vertices.
 * Returns a subgraph that contains all edges that belong to at least one
 * shortest path between any two terminals.
 */
export function distancePreserver(
    graph: Graph,
    terminals: number[]
): Graph {
    const adj = buildAdjacency(graph);
    const needed = new Set<string>(); // encode edge as "u->v"

    // Helper: run Dijkstra (unbounded) from a source
    const dijkstra = (src: number): { dist: number[]; prev: number[][] } => {
        const INF = Number.POSITIVE_INFINITY;
        const dist = new Array(graph.n).fill(INF);
        const prev: number[][] = Array.from({ length: graph.n }, () => []);
        dist[src] = 0;

        const pq: { v: number; d: number }[] = [{ v: src, d: 0 }];
        const heapPush = (item: { v: number; d: number }) => {
            pq.push(item);
            let i = pq.length - 1;
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (pq[p].d <= pq[i].d) break;
                [pq[p], pq[i]] = [pq[i], pq[p]];
                i = p;
            }
        };
        const heapPop = (): { v: number; d: number } | undefined => {
            if (pq.length === 0) return undefined;
            const top = pq[0];
            const last = pq.pop()!;
            if (pq.length > 0) {
                pq[0] = last;
                let i = 0;
                while (true) {
                    let l = i * 2 + 1;
                    let r = l + 1;
                    let smallest = i;
                    if (l < pq.length && pq[l].d < pq[smallest].d) smallest = l;
                    if (r < pq.length && pq[r].d < pq[smallest].d) smallest = r;
                    if (smallest === i) break;
                    [pq[i], pq[smallest]] = [pq[smallest], pq[i]];
                    i = smallest;
                }
            }
            return top;
        };
        heapPush({ v: src, d: 0 });

        while (true) {
            const cur = heapPop();
            if (!cur) break;
            const { v, d } = cur;
            if (d > dist[v]) continue;
            for (const e of adj.get(v)!) {
                const nd = d + e.weight;
                if (nd < dist[e.to]) {
                    dist[e.to] = nd;
                    prev[e.to] = [v];
                    heapPush({ v: e.to, d: nd });
                } else if (Math.abs(nd - dist[e.to]) < 1e-12) {
                    // another shortest predecessor
                    prev[e.to].push(v);
                }
            }
        }
        return { dist, prev };
    };

    // For each ordered terminal pair, backtrack shortest‑path DAG
    for (const s of terminals) {
        const { prev } = dijkstra(s);
        for (const t of terminals) {
            if (s === t) continue;
            // BFS backwards from t to s over predecessor edges
            const stack: number[] = [t];
            const visited = new Set<number>();
            while (stack.length) {
                const cur = stack.pop()!;
                if (cur === s) continue;
                for (const p of prev[cur]) {
                    const key = `${p}->${cur}`;
                    needed.add(key);
                    if (!visited.has(p)) {
                        visited.add(p);
                        stack.push(p);
                    }
                }
            }
        }
    }

    const preserverEdges: Edge[] = [];
    for (const e of graph.edges) {
        const key = `${e.from}->${e.to}`;
        if (needed.has(key)) preserverEdges.push(e);
    }

    return {
        n: graph.n,
        edges: preserverEdges,
    };
}

/**
 * Utility: compute exact all‑pairs shortest distances (unbounded hops)
 * using Floyd‑Warshall – suitable only for small graphs used in tests.
 */
export function allPairsShortestDistances(graph: Graph): number[][] {
    const INF = Number.POSITIVE_INFINITY;
    const d: number[][] = Array.from({ length: graph.n }, () =>
        new Array<number>(graph.n).fill(INF)
    );
    for (let i = 0; i < graph.n; ++i) d[i][i] = 0;
    for (const e of graph.edges) {
        if (e.weight < d[e.from][e.to]) d[e.from][e.to] = e.weight;
    }
    for (let k = 0; k < graph.n; ++k) {
        for (let i = 0; i < graph.n; ++i) {
            if (d[i][k] === INF) continue;
            for (let j = 0; j < graph.n; ++j) {
                const nd = d[i][k] + d[k][j];
                if (nd < d[i][j]) d[i][j] = nd;
            }
        }
    }
    return d;
}
