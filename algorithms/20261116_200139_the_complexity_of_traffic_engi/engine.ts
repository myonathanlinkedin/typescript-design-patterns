import { Graph, NodeId, Edge, Demand, Path, RoutingResult } from "./types";

/**
 * Simple binary min‑heap priority queue for Dijkstra.
 */
class MinHeap<T> {
    private heap: { key: number; value: T }[] = [];

    private swap(i: number, j: number) {
        const tmp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = tmp;
    }

    private bubbleUp(index: number) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.heap[parent].key <= this.heap[index].key) break;
            this.swap(parent, index);
            index = parent;
        }
    }

    private bubbleDown(index: number) {
        const length = this.heap.length;
        while (true) {
            let left = 2 * index + 1;
            let right = 2 * index + 2;
            let smallest = index;

            if (left < length && this.heap[left].key < this.heap[smallest].key) {
                smallest = left;
            }
            if (right < length && this.heap[right].key < this.heap[smallest].key) {
                smallest = right;
            }
            if (smallest === index) break;
            this.swap(index, smallest);
            index = smallest;
        }
    }

    insert(key: number, value: T) {
        this.heap.push({ key, value });
        this.bubbleUp(this.heap.length - 1);
    }

    extractMin(): { key: number; value: T } | undefined {
        if (this.heap.length === 0) return undefined;
        const min = this.heap[0];
        const end = this.heap.pop()!;
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.bubbleDown(0);
        }
        return min;
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }
}

/**
 * Dijkstra's algorithm returning distance map and predecessor map.
 */
export function dijkstra(graph: Graph, source: NodeId): {
    dist: Map<NodeId, number>;
    prev: Map<NodeId, NodeId | null>;
} {
    const dist = new Map<NodeId, number>();
    const prev = new Map<NodeId, NodeId | null>();
    const heap = new MinHeap<NodeId>();

    for (const node of graph.nodes) {
        dist.set(node, Infinity);
        prev.set(node, null);
    }
    dist.set(source, 0);
    heap.insert(0, source);

    while (!heap.isEmpty()) {
        const { key: curDist, value: u } = heap.extractMin()!;
        if (curDist > (dist.get(u) ?? Infinity)) continue; // stale entry

        const edges = graph.adjacency.get(u) ?? [];
        for (const e of edges) {
            const v = e.to;
            const alt = curDist + e.weight;
            if (alt < (dist.get(v) ?? Infinity)) {
                dist.set(v, alt);
                prev.set(v, u);
                heap.insert(alt, v);
            }
        }
    }

    return { dist, prev };
}

/**
 * Reconstruct shortest path from predecessor map.
 */
export function reconstructPath(prev: Map<NodeId, NodeId | null>, source: NodeId, target: NodeId): Path {
    const path: NodeId[] = [];
    let current: NodeId | null = target;
    while (current !== null) {
        path.push(current);
        if (current === source) break;
        current = prev.get(current) ?? null;
    }
    if (path[path.length - 1] !== source) {
        // No path found
        return [];
    }
    path.reverse();
    return path;
}

/**
 * Compute the shortest path between two nodes.
 */
export function shortestPath(graph: Graph, source: NodeId, target: NodeId): Path {
    if (!graph.nodes.has(source) || !graph.nodes.has(target)) return [];
    const { prev } = dijkstra(graph, source);
    return reconstructPath(prev, source, target);
}

/**
 * Generate a Segment Routing (SR) segment list.
 * For this reference implementation we treat each intermediate node
 * (excluding source and destination) as a node‑segment.
 */
export function segmentRoutingPath(graph: Graph, source: NodeId, target: NodeId): {
    path: Path;
    segments: NodeId[];
    cost: number;
} {
    const path = shortestPath(graph, source, target);
    if (path.length === 0) {
        return { path: [], segments: [], cost: 0 };
    }
    const cost = path.reduce((acc, node, idx) => {
        if (idx === 0) return 0;
        const prev = path[idx - 1];
        const edge = (graph.adjacency.get(prev) ?? []).find(e => e.to === node);
        return acc + (edge?.weight ?? 0);
    }, 0);
    const segments = path.slice(1, -1); // exclude source and destination
    return { path, segments, cost };
}

/**
 * Traffic Engineering computation over a set of demands.
 * Returns per‑demand routing results and the aggregate network cost.
 */
export function computeTrafficEngineering(
    graph: Graph,
    demands: Demand[]
): {
    results: RoutingResult[];
    totalCost: number;
} {
    const results: RoutingResult[] = [];
    let totalCost = 0;

    for (const demand of demands) {
        const { path, segments, cost } = segmentRoutingPath(graph, demand.source, demand.destination);
        const weightedCost = cost * demand.volume;
        totalCost += weightedCost;
        results.push({
            demand,
            path,
            cost,
            segmentList: segments,
        });
    }

    return { results, totalCost };
}
