export default class BoundedTreeDepthGraph {
  private nodes: GraphNode[];
  private treeDepth: number;

  constructor(nodes: GraphNode[], treeDepth: number) {
    this.nodes = nodes;
    this.treeDepth = treeDepth;
  }

  public calculateTreeDepth(): number {
    let treeDepth = 0;
    for (const node of this.nodes) {
      if (node.neighbors.length > treeDepth) {
        treeDepth = Math.max(treeDepth, node.neighbors.length);
      }
    }
    return treeDepth;
  }
}

// === FILE: core.ts ===
