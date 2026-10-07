export type NodeId = string | number;

export interface Edge {
    from: NodeId;
    to: NodeId;
    weight: number; // non‑negative
}

export interface Graph {
    nodes: Set<NodeId>;
    adjacency: Map<NodeId, Edge[]>;
}

// Result of Dijkstra
export interface DijkstraResult {
    distances: Map<NodeId, number>;
    previous: Map<NodeId, NodeId | null>;
}
