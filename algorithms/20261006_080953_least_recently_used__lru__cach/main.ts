import { LRUCache } from "./lru";

const lru = new LRUCache(3);

lru.put(1, 1);
lru.put(2, 2);
lru.put(3, 3);
lru.put(4, 4);

console.log(lru.get(1)); // Output: 1
console.log(lru.get(2)); // Output: 2
console.log(lru.get(3)); // Output: undefined (capacity reached)
console.log(lru.get(4)); // Output: 4

// Output: 1 (LRU node is evicted)
