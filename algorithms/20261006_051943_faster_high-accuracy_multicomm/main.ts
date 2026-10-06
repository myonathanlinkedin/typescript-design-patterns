// Define a main function to demonstrate usage of the Graph and MulticommodityFlow classes

const graph = new Graph();
const multicommodityFlow = new MulticommodityFlow(graph);

// Add nodes to the graph
graph.addNode(10);
graph.addNode(20);
graph.addNode(30);
graph.addNode(40);
graph.addNode(50);

// Add edges to the graph
graph.addEdge(1, 2, 10);
graph.addEdge(2, 3, 5);
graph.addEdge(3, 4, 3);
graph.addEdge(4, 5, 4);

// Calculate the total flow value
const totalFlow = multicommodityFlow.calculateFlow();

// Output the result
console.log(totalFlow);

// Output the graph structure
console.log(graph);

// Output the node values
for (const node of graph.getNodeCount().values()) {
  console.log(node);
}

// Output the edge weights
for (const [source, destination, weight] of Object.entries(graph.getEdgeWeightMap()) {
  console.log(`${source} -> ${destination}: ${weight}`);
}
);
