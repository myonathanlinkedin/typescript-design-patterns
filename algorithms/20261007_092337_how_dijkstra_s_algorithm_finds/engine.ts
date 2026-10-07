import { Graph, NodeId, DijkstraResult } from "./types";

/**
 * Simple binary min‑heap for (node, distance) pairs.
 */
class MinHeap {
    private heap: { node: NodeId; dist: number }[] = [];

    private parent(i: number): number { return Math.floor((i - 1) / 2); }
    private left(i: number): number { return 2 * i + 1; }
    private right(i: number): number { return 2 * i + 2; }

    private swap(i: number, j: number): void {
        const tmp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = tmp;
    }

    push(node: NodeId, dist: number): void {
        this.heap.push({ node, dist });
        this.bubbleUp(this.heap.length - 1);
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const p = this.parent(index);
            if (this.heap[p].dist <= this.heap[index].dist) break;
            this.swap(p, index);
            index = p;
        }
    }

    pop(): { node: NodeId; dist: number } | undefined {
        if (this.heap.length === 0) return undefined;
        const min = this.heap[0];
        const end = this.heap.pop()!;
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.bubbleDown(0);
        }
        return min;
    }

    private bubbleDown(index: number): void {
        const length = this.heap.length;
        while (true) {
            const l = this.left(index);
            const r = this.right(index);
            let smallest = index;

            if (l < length && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
            if (r < length && this.heap[r].dist < this.heap[smallest].dist) smallest = r;

            if (smallest === index) break;
            this.swap(index, smallest);
            index = smallest;
        }
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }
}

/**
 * Dijkstra's algorithm.
 * Returns shortest distances from `source` to every reachable node,
 * and a map of each node's predecessor on the shortest path.
 * Throws if a negative edge weight is encountered.
 */
export function dijkstra(graph: Graph, source: NodeId): DijkstraResult {
    // Validate source
    if (!graph.nodes.has(source)) {
        throw new Error(`Source node ${source} does not exist in the graph`);
    }

    // Initialize distances
    const distances = new Map<NodeId, number>();
    const previous = new Map<NodeId, NodeId | null>();
    for (const n of graph.nodes) {
        distances.set(n, Infinity);
        previous.set(n, null);
    }
    distances.set(source, 0);

    const heap = new MinHeap();
    heap.push(source, 0);

    while (!heap.isEmpty()) {
        const current = heap.pop()!;
        const u = current.node;
        const distU = current.dist;

        // Skip stale entries
        if (distU > (distances.get(u) ?? Infinity)) continue;

        const edges = graph.adjacency.get(u) ?? [];
        for (const edge of edges) {
            if (edge.weight < 0) {
                throw new Error("Dijkstra's algorithm does not support negative edge weights");
            }
            const v = edge.to;
            const alt = (distances.get(u) ?? Infinity) + edge.weight;
            if (alt < (distances.get(v) ?? Infinity)) {
                distances.set(v, alt);
                previous.set(v, u);
                heap.push(v, alt);
            }
        }
    }

    return { distances, previous };
}

/**
 * Reconstructs the shortest path from `source` to `target` using the `previous` map.
 * Returns an array of node ids from source to target inclusive.
 * If target is unreachable, returns an empty array.
 */
export function reconstructPath(previous: Map<NodeId, NodeId | null>, source: NodeId, target: NodeId): NodeId[] {
    const path: NodeId[] = [];
    let current: NodeId | null = target;
    while (current !== null) {
        path.push(current);
        if (current === source) break;
        current = previous.get(current) ?? null;
    }
    if (path[path.length - 1] !== source) {
        // Unreachable
        return [];
    }
    return path.reverse();
}
