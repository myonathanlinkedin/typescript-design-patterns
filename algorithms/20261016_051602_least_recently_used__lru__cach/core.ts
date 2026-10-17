/**
 * LRU Cache implementation using a doubly linked list and a hash map.
 * All operations (get, put, delete) run in O(1) time.
 *
 * Time Complexity:
 *  - get:   O(1)
 *  - put:   O(1)
 *  - delete: O(1)
 *
 * Space Complexity: O(capacity) for stored entries plus O(1) overhead.
 */
export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, ListNode<K, V>>;

  // Sentinel nodes for head (most recent) and tail (least recent)
  private head: ListNode<K, V>;
  private tail: ListNode<K, V>;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new Error('Capacity must be a non‑negative integer');
    }
    this.capacity = capacity;
    this.map = new Map();

    // Initialize empty doubly linked list with dummy head/tail
    this.head = new ListNode<K, V>(null as any, null as any);
    this.tail = new ListNode<K, V>(null as any, null as any);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /** Return the value associated with `key` and mark it as most recently used. */
  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);
    return node.value;
  }

  /** Insert or update the value for `key`. Evicts least recently used entry if needed. */
  put(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }

    if (this.map.size >= this.capacity && this.capacity > 0) {
      this.evictLeastRecent();
    }

    if (this.capacity === 0) {
      // No storage allowed; silently ignore.
      return;
    }

    const node = new ListNode(key, value);
    this.map.set(key, node);
    this.insertAfter(this.head, node);
  }

  /** Remove `key` from the cache if present. */
  delete(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    this.removeNode(node);
    this.map.delete(key);
    return true;
  }

  /** Current number of stored entries. */
  size(): number {
    return this.map.size;
  }

  /** Internal: move a node to the front (right after head). */
  private moveToFront(node: ListNode<K, V>): void {
    this.removeNode(node);
    this.insertAfter(this.head, node);
  }

  /** Internal: evict the node just before tail (least recently used). */
  private evictLeastRecent(): void {
    const lru = this.tail.prev;
    if (lru && lru !== this.head) {
      this.removeNode(lru);
      this.map.delete(lru.key);
    }
  }

  /** Internal: unlink a node from the list. */
  private removeNode(node: ListNode<K, V>): void {
    const prev = node.prev!;
    const next = node.next!;
    prev.next = next;
    next.prev = prev;
    node.prev = null;
    node.next = null;
  }

  /** Internal: insert `node` right after `anchor`. */
  private insertAfter(anchor: ListNode<K, V>, node: ListNode<K, V>): void {
    const next = anchor.next!;
    node.prev = anchor;
    node.next = next;
    anchor.next = node;
    next.prev = node;
  }
}

/** Doubly linked list node used by LRUCache. */
class ListNode<K, V> {
  key: K;
  value: V;
  prev: ListNode<K, V> | null = null;
  next: ListNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}
