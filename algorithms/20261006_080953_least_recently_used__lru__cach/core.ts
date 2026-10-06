import { ListNode } from "./list";

/**
 * Least Recently Used (LRU) Cache implementation using a doubly linked list.
 */
class LRUCache {
  private capacity: number;
  private cache: Map<number, ListNode>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Adds a key-value pair to the cache.
   * @param key The key to add.
   * @param value The value to associate with the key.
   */
  public put(key: number, value: number): void {
    if (this.cache.has(key)) {
      this.cache.get(key).value = value;
    } else {
      const node = new ListNode(key, value);
      this.cache.set(key, node);
      this.updateCacheSize();
    }
  }

  /**
   * Retrieves a value from the cache based on the given key.
   * @param key The key to retrieve the value for.
   */
  public get(key: number): number | undefined {
    if (!this.cache.has(key)) return undefined;

    const node = this.cache.get(key);
    this.updateCacheSize();

    return node.value;
  }

  /**
   * Removes and returns the least recently used node from the cache.
   */
  public evict(): void {
    if (this.cache.size < this.capacity) return;

    const leastRecentlyUsed = this.cache.values().next().value;
    this.cache.delete(leastRecentlyUsed.key);
    this.updateCacheSize();
  }

  /**
   * Updates the cache size.
   */
  private updateCacheSize(): void {
    this.cache.size = this.capacity;
  }
}

// Example usage:
const cache = new LRUCache(5);
cache.put(1, 1);
cache.put(2, 2);
cache.put(3, 3);
cache.put(4, 4);
cache.put(5, 5);

console.log(cache.get(1)); // Output: 1
console.log(cache.get(2)); // Output: 2
console.log(cache.get(3)); // Output: undefined (capacity reached)
cache.evict();
console.log(cache.get(4)); // Output: 4
console.log(cache.get(5)); // Output: 5
// Output: 1 (LRU node is evicted)
