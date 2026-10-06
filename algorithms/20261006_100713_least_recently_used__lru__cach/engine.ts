import { LRUNode, LRUCache } from './types';

/**
 * Implementation of an LRU Cache using a HashMap and a Doubly Linked List.
 * 
 * Time Complexity:
 * - get: O(1)
 * - put: O(1)
 * 
 * Space Complexity:
 * - O(capacity)
 */
export class LRUCacheImpl<K, V> implements LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map: Map<K, LRUNode<K, V>>;
  
  // Dummy head and tail nodes to simplify edge cases
  private readonly head: LRUNode<K, V>;
  private readonly tail: LRUNode<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Capacity must be a positive integer.");
    }
    this.capacity = capacity;
    this.map = new Map<K, LRUNode<K, V>>();
    
    // Initialize dummy nodes
    this.head = { key: null as unknown as K, value: null as unknown as V, prev: null, next: null };
    this.tail = { key: null as unknown as K, value: null as unknown as V, prev: null, next: null };
    
    // Link head and tail
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get size(): number {
    return this.map.size;
  }

  get capacity(): number {
    return this.capacity;
  }

  /**
   * Retrieves the value for a given key.
   * Moves the node to the front (most recently used) if found.
   */
  get(key: K): V | null {
    const node = this.map.get(key);
    if (!node) {
      return null;
    }
    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  /**
   * Inserts or updates a key-value pair.
   * If the key exists, update value and move to front.
   * If the key is new, add to front. If capacity is exceeded, evict from back.
   */
  put(key: K, value: V): void {
    const existingNode = this.map.get(key);
    
    if (existingNode) {
      // Update value and move to front
      existingNode.value = value;
      this.moveToFront(existingNode);
    } else {
      // Create new node
      const newNode: LRUNode<K, V> = {
        key,
        value,
        prev: null,
        next: null
      };
      
      // If at capacity, evict least recently used (tail.prev)
      if (this.map.size >= this.capacity) {
        const lruNode = this.tail.prev;
        if (lruNode) {
          this.removeNode(lruNode);
          this.map.delete(lruNode.key);
        }
      }
      
      // Add new node to front
      this.addToFront(newNode);
      this.map.set(key, newNode);
    }
  }

  /**
   * Removes a node from the linked list.
   */
  private removeNode(node: LRUNode<K, V>): void {
    const prev = node.prev;
    const next = node.next;
    
    if (prev) {
      prev.next = next;
    }
    if (next) {
      next.prev = prev;
    }
    
    // Clear pointers to help garbage collection
    node.prev = null;
    node.next = null;
  }

  /**
   * Adds a node to the front of the linked list (after head).
   */
  private addToFront(node: LRUNode<K, V>): void {
    const next = this.head.next;
    
    this.head.next = node;
    node.prev = this.head;
    node.next = next;
    
    if (next) {
      next.prev = node;
    }
  }

  /**
   * Moves an existing node to the front of the linked list.
   */
  private moveToFront(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addToFront(node);
  }
}
