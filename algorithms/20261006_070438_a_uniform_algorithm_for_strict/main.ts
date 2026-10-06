import { BoundedTreeDepthGraph } from './core';

// Example usage:
const graph = new BoundedTreeDepthGraph([
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
], 3);

console.log(graph.calculateTreeDepth()); // Output: 3
