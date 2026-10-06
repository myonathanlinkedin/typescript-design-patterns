/**
 * Represents a single node in the doubly linked list.
 * Each node stores a key-value pair and maintains pointers to its neighbors.
 */
export interface LRUNode<K, V> {
  key: K;
  value: V;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

/**
 * Defines the public interface for an LRU Cache.
 */
export interface LRUCache<K, V> {
  /**
   * Retrieves the value associated with the given key.
   * If the key exists, it is marked as most recently used.
   * @param key - The key to look up.
   * @returns The value if found, otherwise null.
   */
  get(key: K): V | null;

  /**
   * Inserts or updates a key-value pair.
   * If the key already exists, its value is updated and it is marked as most recently used.
   * If the cache is at capacity and the key is new, the least recently used item is evicted.
   * @param key - The key to insert or update.
   * @param value - The value to associate with the key.
   */
  put(key: K, value: V): void;

  /**
   * Returns the current number of items in the cache.
   */
  readonly size: number;

  /**
   * Returns the maximum capacity of the cache.
   */
  readonly capacity: number;
}
