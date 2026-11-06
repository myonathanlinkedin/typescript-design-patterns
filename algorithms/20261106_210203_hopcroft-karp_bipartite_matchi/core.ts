export class HopcroftKarp {
    private readonly nLeft: number;
    private readonly nRight: number;
    private readonly adj: number[][]; // adjacency list from left vertices to right vertices
    private pairU: number[]; // pairU[u] = matched right vertex or -1
    private pairV: number[]; // pairV[v] = matched left vertex or -1
    private dist: number[];

    /**
     * @param nLeft  Number of vertices on the left side (indexed 0 … nLeft‑1)
     * @param nRight Number of vertices on the right side (indexed 0 … nRight‑1)
     * @param edges  Array of edges, each edge is a tuple [u, v] where u ∈ left, v ∈ right
     */
    constructor(nLeft: number, nRight: number, edges: [number, number][]) {
        if (!Number.isInteger(nLeft) || nLeft < 0) throw new Error('nLeft must be a non‑negative integer');
        if (!Number.isInteger(nRight) || nRight < 0) throw new Error('nRight must be a non‑negative integer');
        this.nLeft = nLeft;
        this.nRight = nRight;
        this.adj = Array.from({ length: nLeft }, () => []);
        for (const [u, v] of edges) {
            if (u < 0 || u >= nLeft) throw new Error(`Left vertex ${u} out of bounds`);
            if (v < 0 || v >= nRight) throw new Error(`Right vertex ${v} out of bounds`);
            this.adj[u].push(v);
        }
        this.pairU = new Array(nLeft).fill(-1);
        this.pairV = new Array(nRight).fill(-1);
        this.dist = new Array(nLeft);
    }

    /**
     * Executes the Hopcroft‑Karp algorithm and returns the cardinality of a maximum matching.
     */
    public maxMatching(): number {
        let matching = 0;
        while (this.bfs()) {
            for (let u = 0; u < this.nLeft; u++) {
                if (this.pairU[u] === -1 && this.dfs(u)) {
                    matching++;
                }
            }
        }
        return matching;
    }

    /**
     * Returns an array where result[u] = matched right vertex or -1 if u is free.
     */
    public getMatching(): number[] {
        return this.pairU.slice();
    }

    // ---------- Private helper methods ----------
    private bfs(): boolean {
        const queue: number[] = [];
        for (let u = 0; u < this.nLeft; u++) {
            if (this.pairU[u] === -1) {
                this.dist[u] = 0;
                queue.push(u);
            } else {
                this.dist[u] = -1; // INF sentinel
            }
        }
        let foundFreeRight = false;

        while (queue.length > 0) {
            const u = queue.shift()!;
            for (const v of this.adj[u]) {
                const pu = this.pairV[v];
                if (pu !== -1 && this.dist[pu] === -1) {
                    this.dist[pu] = this.dist[u] + 1;
                    queue.push(pu);
                }
                if (pu === -1) {
                    foundFreeRight = true;
                }
            }
        }
        return foundFreeRight;
    }

    private dfs(u: number): boolean {
        for (const v of this.adj[u]) {
            const pu = this.pairV[v];
            if (pu === -1 || (this.dist[pu] === this.dist[u] + 1 && this.dfs(pu))) {
                this.pairU[u] = v;
                this.pairV[v] = u;
                return true;
            }
        }
        this.dist[u] = -1; // mark as dead end
        return false;
    }
}
