export type NodeId = string;

export interface Edge {
    from: NodeId;
    to: NodeId;
    capacity: number; // positive integer capacity
}

export interface Graph {
    nodes: Set<NodeId>;
    edges: Edge[];
}

// Result of a max‑flow computation
export interface FlowResult {
    value: number;               // total flow value
    residual: Map<string, number>; // residual capacity keyed as "u->v"
}
