export type NodeId = number;

export interface Graph {
  /** Set of all node identifiers in the graph */
  nodes: Set<NodeId>;
  /** Adjacency list mapping each node to its neighboring nodes */
  adjacency: Map<NodeId, Set<NodeId>>;
}

/**
 * Utility to create an undirected graph from a list of edges.
 * Duplicate edges and self‑loops are ignored.
 *
 * @param edges Array of [u, v] pairs representing undirected edges.
 * @returns A Graph instance.
 */
export function buildGraph(edges: Array<[NodeId, NodeId]>): Graph {
  const nodes = new Set<NodeId>();
  const adjacency = new Map<NodeId, Set<NodeId>>();

  for (const [u, v] of edges) {
    if (u === v) continue; // ignore self‑loops
    nodes.add(u);
    nodes.add(v);

    if (!adjacency.has(u)) adjacency.set(u, new Set<NodeId>());
    if (!adjacency.has(v)) adjacency.set(v, new Set<NodeId>());

    adjacency.get(u)!.add(v);
    adjacency.get(v)!.add(u);
  }

  // Ensure isolated nodes are represented in adjacency map
  for (const n of nodes) {
    if (!adjacency.has(n)) adjacency.set(n, new Set<NodeId>());
  }

  return { nodes, adjacency };
}
