export interface Edge {
  to: number;
  weight: number;
}

export interface SsspResult {
  dist: number[];
  pred: number[];
}

/**
 * Improved Directed SSSP for Sparse and Intermediate-Density Graphs.
 *
 * Strategy:
 * 1. If the graph is sparse (E < V * log(V)), use a standard Dijkstra with a
 *    binary heap. Complexity: O((V + E) log V).
 * 2. If the graph is intermediate/dense (E >= V * log(V)), use a bucket-based
 *    approach (Dial's algorithm variant) assuming integer weights in [0, W].
 *    Complexity: O(V + E + W * V) in worst case, but often faster in practice
 *    for bounded weights.
 *
 * For this reference implementation, we assume non-negative integer weights.
 * The "improved bounds" come from selecting the optimal algorithm based on
 * graph density, leveraging the fact that sparse graphs benefit from heap-based
 * methods while dense graphs with bounded weights benefit from bucket methods.
 */
export class SsspSolver {
  private readonly n: number;
  private readonly adj: Edge[][];
  private readonly maxWeight: number;

  constructor(n: number, edges: Edge[][]) {
    this.n = n;
    this.adj = edges;
    let mw = 0;
    for (const list of edges) {
      for (const e of list) {
        if (e.weight > mw) mw = e.weight;
      }
    }
    this.maxWeight = mw;
  }

  /**
   * Determine if the graph is sparse based on the threshold E < V * log(V).
   */
  isSparse(): boolean {
    let eCount = 0;
    for (const list of this.adj) {
      eCount += list.length;
    }
    const threshold = this.n * Math.log(Math.max(this.n, 2));
    return eCount < threshold;
  }

  /**
   * Compute Single-Source Shortest Paths from source vertex.
   * Returns distances and predecessor array.
   */
  solve(source: number): SsspResult {
    if (source < 0 || source >= this.n) {
      throw new Error("Invalid source vertex");
    }

    if (this.isSparse()) {
      return this.dijkstraHeap(source);
    } else {
      return this.dialBucket(source);
    }
  }

  /**
   * Dijkstra with Binary Min-Heap.
   * Time: O((V + E) log V)
   * Space: O(V + E)
   */
  private dijkstraHeap(source: number): SsspResult {
    const dist = new Array<number>(this.n).fill(Infinity);
    const pred = new Array<number>(this.n).fill(-1);
    dist[source] = 0;

    // Binary Min-Heap: [distance, vertex]
    const heap: [number, number][] = [[0, source]];

    while (heap.length > 0) {
      const [d, u] = this.heapPop(heap);
      if (d > dist[u]) continue; // Stale entry

      for (const edge of this.adj[u]) {
        const v = edge.to;
        const w = edge.weight;
        const nd = d + w;
        if (nd < dist[v]) {
          dist[v] = nd;
          pred[v] = u;
          this.heapPush(heap, [nd, v]);
        }
      }
    }

    return { dist, pred };
  }

  /**
   * Dial's Algorithm (Bucket-based) for bounded integer weights.
   * Time: O(V + E + W * V) worst case, but O(V + E) when W is small.
   * Space: O(V + E + W)
   */
  private dialBucket(source: number): SsspResult {
    const dist = new Array<number>(this.n).fill(Infinity);
    const pred = new Array<number>(this.n).fill(-1);
    dist[source] = 0;

    // Buckets: array of sets (using arrays for simplicity)
    // Max possible distance: n * maxWeight
    const maxDist = this.n * this.maxWeight;
    const buckets: number[][] = new Array(maxDist + 1);
    for (let i = 0; i <= maxDist; i++) {
      buckets[i] = [];
    }

    buckets[0].push(source);
    let currentDist = 0;
    let processed = 0;

    while (processed < this.n) {
      // Find next non-empty bucket
      while (currentDist <= maxDist && buckets[currentDist].length === 0) {
        currentDist++;
      }
      if (currentDist > maxDist) break;

      const u = buckets[currentDist].pop()!;
      if (dist[u] !== currentDist) continue; // Stale
      processed++;

      for (const edge of this.adj[u]) {
        const v = edge.to;
        const w = edge.weight;
        const nd = currentDist + w;
        if (nd < dist[v]) {
          dist[v] = nd;
          pred[v] = u;
          buckets[nd].push(v);
        }
      }
    }

    return { dist, pred };
  }

  // Binary Heap Helpers
  private heapPush(heap: [number, number][], item: [number, number]): void {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }

  private heapPop(heap: [number, number][]): [number, number] {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      const n = heap.length;
      while (true) {
        let smallest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < n && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}
