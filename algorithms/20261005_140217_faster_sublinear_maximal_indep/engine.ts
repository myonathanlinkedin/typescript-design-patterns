import { Graph, NodeId } from "./types";

/**
 * Computes the size of a maximal independent set (MIS) using a greedy
 * deterministic algorithm. The algorithm iterates over nodes in ascending
 * order of their identifiers, adding a node to the independent set if none
 * of its already‑selected neighbors are present.
 *
 * This yields a maximal (not necessarily maximum) independent set.
 *
 * @param graph Input undirected graph.
 * @returns Cardinality of a maximal independent set.
 */
export function maximalIndependentSetSize(graph: Graph): number {
  const selected = new Set<NodeId>();
  const blocked = new Set<NodeId>();

  // Process nodes in deterministic order for reproducibility
  const orderedNodes = Array.from(graph.nodes).sort((a, b) => a - b);

  for (const node of orderedNodes) {
    if (blocked.has(node)) continue; // cannot be added, neighbor already selected
    selected.add(node);
    // Block all neighbors to maintain independence
    const neighbors = graph.adjacency.get(node);
    if (neighbors) {
      for (const nb of neighbors) {
        blocked.add(nb);
      }
    }
  }

  return selected.size;
}

/**
 * Generates a random undirected graph using the Erdős–Rényi G(n, p) model.
 *
 * @param n Number of vertices.
 * @param p Edge probability (0 ≤ p ≤ 1).
 * @param rng Optional deterministic random number generator.
 * @returns A Graph instance.
 */
export function generateRandomGraph(
  n: number,
  p: number,
  rng: () => number = Math.random
): Graph {
  const edges: Array<[NodeId, NodeId]> = [];
  for (let u = 0; u < n; ++u) {
    for (let v = u + 1; v < n; ++v) {
      if (rng() < p) edges.push([u, v]);
    }
  }
  // Ensure isolated vertices are present even if they have no edges
  for (let i = 0; i < n; ++i) {
    edges.push([i, i]); // self‑loop will be ignored by buildGraph, guaranteeing node existence
  }
  // buildGraph will filter out self‑loops
  const { buildGraph } = require("./types") as typeof import("./types");
  return buildGraph(edges);
}
