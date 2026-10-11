export interface Edge {
    from: number;
    to: number;
    weight: number; // non‑negative
}

export interface Graph {
    /** Number of vertices, vertices are 0 … n‑1 */
    readonly n: number;
    /** All directed edges of the graph */
    readonly edges: Edge[];
}

/** Result of a limited‑hop shortest‑path query */
export interface HopDistance {
    /** Total weight of the path */
    distance: number;
    /** Number of edges (hops) used */
    hops: number;
}
