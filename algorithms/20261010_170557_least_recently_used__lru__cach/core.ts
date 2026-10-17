/**
 * LRU Cache implementation using a hashmap and a doubly linked list.
 * All operations (get, put) run in O(1) time.
 * Space complexity is O(capacity).
 */
export class LRUCache<K, V> {
    private capacity: number;
    private map: Map<K, ListNode<K, V>>;
    private head: ListNode<K, V>; // most recently used sentinel
    private tail: ListNode<K, V>; // least recently used sentinel

    constructor(capacity: number) {
        if (capacity < 0) {
            throw new Error('Capacity must be non‑negative');
        }
        this.capacity = capacity;
        this.map = new Map();

        // Initialize empty doubly linked list with dummy head/tail
        this.head = new ListNode<K, V>(null as any, null as any);
        this.tail = new ListNode<K, V>(null as any, null as any);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    /** Retrieve value for key, updating recentness. Returns undefined if absent. */
    get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) return undefined;
        this.moveToFront(node);
        return node.value;
    }

    /** Insert or update key with value. Evicts LRU entry if over capacity. */
    put(key: K, value: V): void {
        const existing = this.map.get(key);
        if (existing) {
            existing.value = value;
            this.moveToFront(existing);
            return;
        }

        const newNode = new ListNode(key, value);
        this.map.set(key, newNode);
        this.addToFront(newNode);

        if (this.map.size > this.capacity) {
            this.evictLRU();
        }
    }

    /** Remove a key from the cache. Returns true if removed. */
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

    /** Internal: move a node to the front (most recent). */
    private moveToFront(node: ListNode<K, V>): void {
        this.removeNode(node);
        this.addToFront(node);
    }

    /** Internal: prepend node right after head sentinel. */
    private addToFront(node: ListNode<K, V>): void {
        node.prev = this.head;
        node.next = this.head.next!;
        this.head.next!.prev = node;
        this.head.next = node;
    }

    /** Internal: unlink node from list. */
    private removeNode(node: ListNode<K, V>): void {
        node.prev!.next = node.next;
        node.next!.prev = node.prev;
        node.prev = undefined;
        node.next = undefined;
    }

    /** Internal: evict the least recently used node (just before tail). */
    private evictLRU(): void {
        const lru = this.tail.prev!;
        if (lru === this.head) return; // cache capacity zero
        this.removeNode(lru);
        this.map.delete(lru.key);
    }
}

/** Doubly linked list node used by LRUCache. */
class ListNode<K, V> {
    key: K;
    value: V;
    prev?: ListNode<K, V>;
    next?: ListNode<K, V>;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}
