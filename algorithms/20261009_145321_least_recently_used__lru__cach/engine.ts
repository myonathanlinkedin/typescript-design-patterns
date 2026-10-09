import { ListNode } from "./types";

/**
 * Least Recently Used (LRU) Cache implementation using a doubly linked list
 * and a hashmap for O(1) get and put operations.
 *
 * @typeParam K - type of the cache key (must be usable as a Map key)
 * @typeParam V - type of the cache value
 */
export class LRUCache<K, V> {
    private capacity: number;
    private cache: Map<K, ListNode<K, V>>;

    // Dummy head and tail nodes to avoid edge‑case checks
    private head: ListNode<K, V>;
    private tail: ListNode<K, V>;

    constructor(capacity: number) {
        if (!Number.isInteger(capacity) || capacity < 0) {
            throw new Error("Capacity must be a non‑negative integer");
        }
        this.capacity = capacity;
        this.cache = new Map();

        // Initialize dummy nodes
        this.head = { key: null as any, value: null as any, prev: null, next: null };
        this.tail = { key: null as any, value: null as any, prev: null, next: null };
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    /**
     * Retrieves a value from the cache.
     * If the key exists, the node is moved to the head (most recently used).
     *
     * @param key - cache key
     * @returns the associated value, or undefined if not present
     */
    get(key: K): V | undefined {
        if (this.capacity === 0) return undefined;
        const node = this.cache.get(key);
        if (!node) return undefined;
        this.moveToHead(node);
        return node.value;
    }

    /**
     * Inserts or updates a key/value pair.
     * If insertion exceeds capacity, the least recently used entry is evicted.
     *
     * @param key - cache key
     * @param value - cache value
     */
    put(key: K, value: V): void {
        if (this.capacity === 0) return;

        const existingNode = this.cache.get(key);
        if (existingNode) {
            existingNode.value = value;
            this.moveToHead(existingNode);
            return;
        }

        const newNode: ListNode<K, V> = {
            key,
            value,
            prev: null,
            next: null,
        };
        this.cache.set(key, newNode);
        this.addNode(newNode);

        if (this.cache.size > this.capacity) {
            const tail = this.popTail();
            if (tail) {
                this.cache.delete(tail.key);
            }
        }
    }

    // ---------- Private helper methods ----------

    /**
     * Inserts a node right after the dummy head.
     */
    private addNode(node: ListNode<K, V>): void {
        node.prev = this.head;
        node.next = this.head.next;
        if (this.head.next) this.head.next.prev = node;
        this.head.next = node;
    }

    /**
     * Removes a node from its current position.
     */
    private removeNode(node: ListNode<K, V>): void {
        const prev = node.prev;
        const next = node.next;
        if (prev) prev.next = next;
        if (next) next.prev = prev;
        node.prev = null;
        node.next = null;
    }

    /**
     * Moves an existing node to the head (most recently used).
     */
    private moveToHead(node: ListNode<K, V>): void {
        this.removeNode(node);
        this.addNode(node);
    }

    /**
     * Pops the least recently used node (right before dummy tail).
     */
    private popTail(): ListNode<K, V> | null {
        const node = this.tail.prev;
        if (node && node !== this.head) {
            this.removeNode(node);
            return node;
        }
        return null;
    }

    /**
     * Returns current number of stored entries (for testing).
     */
    size(): number {
        return this.cache.size;
    }
}
