export type Edge = { to: string; weight: number };
export type Graph = Map<string, Edge[]>;

export type DijkstraResult = {
  distances: Map<string, number>;
  previous: Map<string, string | null>;
};

class MinHeap<T> {
  private data: T[] = [];

  constructor(private compare: (a: T, b: T) => number) {}

  size(): number {
    return this.data.length;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  push(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const end = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = end;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(idx: number): void {
    const element = this.data[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.data[parentIdx];
      if (this.compare(element, parent) >= 0) break;
      this.data[parentIdx] = element;
      this.data[idx] = parent;
      idx = parentIdx;
    }
  }

  private bubbleDown(idx: number): void {
    const length = this.data.length;
    const element = this.data[idx];
    while (true) {
      let leftIdx = 2 * idx + 1;
      let rightIdx = 2 * idx + 2;
      let swapIdx: number | null = null;

      if (leftIdx < length) {
        const left = this.data[leftIdx];
        if (this.compare(left, element) < 0) swapIdx = leftIdx;
      }

      if (rightIdx < length) {
        const right = this.data[rightIdx];
        if (
          (swapIdx === null && this.compare(right, element) < 0) ||
          (swapIdx !== null && this.compare(right, this.data[swapIdx]) < 0)
        ) {
          swapIdx = rightIdx;
        }
      }

      if (swapIdx === null) break;
      this.data[idx] = this.data[swapIdx];
      this.data[swapIdx] = element;
      idx = swapIdx;
    }
  }
}

/**
 * Dijkstra's algorithm for shortest paths from a source node.
 * Throws an error if any edge has a negative weight.
 */
export function dijkstra(graph: Graph, source: string): DijkstraResult {
  if (!graph.has(source)) {
    throw new Error(`Source node "${source}" does not exist in the graph.`);
  }

  // Validate non‑negative weights
  for (const [node, edges] of graph.entries()) {
    for (const e of edges) {
      if (e.weight < 0) {
        throw new Error(`Negative edge weight detected from "${node}" to "${e.to}".`);
      }
    }
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of graph.keys()) {
    distances.set(node, Infinity);
    previous.set(node, null);
  }
  distances.set(source, 0);

  const heap = new MinHeap<{ node: string; dist: number }>((a, b) => a.dist - b.dist);
  heap.push({ node: source, dist: 0 });

  while (!heap.isEmpty()) {
    const { node: u } = heap.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);

    const uDist = distances.get(u)!;
    const neighbors = graph.get(u) ?? [];

    for (const { to: v, weight } of neighbors) {
      if (visited.has(v)) continue;
      const alt = uDist + weight;
      if (alt < distances.get(v)!) {
        distances.set(v, alt);
        previous.set(v, u);
        heap.push({ node: v, dist: alt });
      }
    }
  }

  return { distances, previous };
}
