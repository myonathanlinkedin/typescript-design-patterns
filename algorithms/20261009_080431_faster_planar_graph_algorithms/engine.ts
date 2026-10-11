import { VertexId, Edge, PlanarGraph, Meander } from "./types";

/**
 * Disjoint Set Union (Union‑Find) with path compression and union by size.
 * Provides near‑constant amortised time for connectivity queries.
 */
class DisjointSet {
    private parent: number[];
    private size: number[];

    constructor(n: number) {
        this.parent = new Array<number>(n);
        this.size = new Array<number>(n);
        for (let i = 0; i < n; i++) {
            this.parent[i] = i;
            this.size[i] = 1;
        }
    }

    find(x: number): number {
        let root = x;
        while (root !== this.parent[root]) {
            root = this.parent[root];
        }
        // Path compression
        while (x !== root) {
            const next = this.parent[x];
            this.parent[x] = root;
            x = next;
        }
        return root;
    }

    union(a: number, b: number): void {
        let ra = this.find(a);
        let rb = this.find(b);
        if (ra === rb) return;
        // Union by size
        if (this.size[ra] < this.size[rb]) {
            [ra, rb] = [rb, ra];
        }
        this.parent[rb] = ra;
        this.size[ra] += this.size[rb];
    }
}

/**
 * Core engine handling planar graph construction, planarity validation,
 * connectivity queries, and Meander extraction.
 */
export class PlanarGraphEngine {
    private readonly n: number;
    private readonly vertices: Set<VertexId>;
    private readonly edges: Edge[];
    private readonly dsu: DisjointSet;

    constructor(vertexCount: number) {
        if (!Number.isInteger(vertexCount) || vertexCount <= 0) {
            throw new Error("vertexCount must be a positive integer");
        }
        this.n = vertexCount;
        this.vertices = new Set<VertexId>();
        for (let i = 0; i < vertexCount; i++) {
            this.vertices.add(i);
        }
        this.edges = [];
        this.dsu = new DisjointSet(vertexCount);
    }

    /**
     * Adds an undirected edge (u, v) to the graph.
     * Throws if the edge would violate planarity under the canonical linear embedding.
     */
    addEdge(u: VertexId, v: VertexId): void {
        this.validateVertex(u);
        this.validateVertex(v);
        if (u === v) {
            throw new Error("Self‑loops are not allowed");
        }
        // Normalise order for crossing detection
        const [a, b] = u < v ? [u, v] : [v, u];
        // Duplicate detection
        for (const e of this.edges) {
            if ((e.u === a && e.v === b) || (e.u === b && e.v === a)) {
                throw new Error(`Edge (${u}, ${v}) already exists`);
            }
        }
        // Planarity test: O(E) pairwise crossing detection under linear ordering
        for (const e of this.edges) {
            const [c, d] = e.u < e.v ? [e.u, e.v] : [e.v, e.u];
            // Crossing occurs iff a < c < b < d or c < a < d < b
            const crosses = (a < c && c < b && b < d) || (c < a && a < d && d < b);
            if (crosses) {
                throw new Error(`Adding edge (${u}, ${v}) would create a crossing with edge (${e.u}, ${e.v})`);
            }
        }
        // Edge is safe to insert
        this.edges.push({ u, v });
        this.dsu.union(u, v);
    }

    /**
     * Returns true iff vertices u and v belong to the same connected component.
     */
    isConnected(u: VertexId, v: VertexId): boolean {
        this.validateVertex(u);
        this.validateVertex(v);
        return this.dsu.find(u) === this.dsu.find(v);
    }

    /**
     * Extracts a simple Meander representation.
     * Vertices are placed on a line in natural order 0 … n‑1.
     * Edges with even insertion index are drawn above the line (top),
     * odd indices below (bottom). The endpoint order follows the edge order.
     */
    getMeander(): Meander {
        const top: VertexId[] = [];
        const bottom: VertexId[] = [];
        this.edges.forEach((e, idx) => {
            if (idx % 2 === 0) {
                top.push(e.u, e.v);
            } else {
                bottom.push(e.u, e.v);
            }
        });
        return { top, bottom };
    }

    /**
     * Returns a shallow copy of the underlying graph structure.
     */
    getGraph(): PlanarGraph {
        return {
            vertices: new Set(this.vertices),
            edges: this.edges.slice(),
        };
    }

    private validateVertex(v: VertexId): void {
        if (!Number.isInteger(v) || v < 0 || v >= this.n) {
            throw new Error(`Vertex ${v} is out of bounds`);
        }
    }
}
