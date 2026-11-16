export type NodeId = string | number;

export interface Edge {
    from: NodeId;
    to: NodeId;
    weight: number; // positive cost
}

export interface Graph {
    nodes: Set<NodeId>;
    adjacency: Map<NodeId, Edge[]>; // outgoing edges
}

export interface Demand {
    source: NodeId;
    destination: NodeId;
    volume: number; // non‑negative traffic amount
}

export type Path = NodeId[]; // ordered list of nodes from source to destination

export interface RoutingResult {
    demand: Demand;
    path: Path;          // empty if no feasible path
    cost: number;        // sum of edge weights along the path (0 if path empty)
    segmentList: NodeId[]; // SR segments (here simply the intermediate nodes)
}
