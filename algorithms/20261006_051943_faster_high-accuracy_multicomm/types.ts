// Define domain models, interfaces, or memory structs

// Define a Graph interface for representing a graph
interface Graph {
  addEdge(node1: number, node2: number, weight: number): void;
  getEdgeWeight(node1: number, node2: number): number;
  getNodeCount(): number;
  getEdgeCount(): number;
}

// Define a Node struct for representing a node in the graph
interface Node {
  id: number;
  value: number;
}

// Define a Flow struct for representing the flow value between two nodes
interface Flow {
  [node1: number]: number;
}
