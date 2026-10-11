export type VertexId = number;

export interface Edge {
    readonly u: VertexId;
    readonly v: VertexId;
}

export interface PlanarGraph {
    readonly vertices: Set<VertexId>;
    readonly edges: Edge[];
}

/**
 * Meander representation of a planar embedding.
 * `top` and `bottom` list the vertex identifiers of edge endpoints
 * as they appear on the two parallel lines of the meander.
 */
export interface Meander {
    readonly top: VertexId[];
    readonly bottom: VertexId[];
}
