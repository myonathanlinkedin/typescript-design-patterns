import { ListNode } from "./types";

/**
 * Least Recently Used (LRU) Cache implementation.
 * Guarantees O(1) time for get and put operations.
 */
export class LRUCache<K, V> {
    private capacity: number;
    private map: Map<K, ListNode<K, V>>;
    private head: ListNode<K, V> | null; // Most recently used
    private tail: ListNode<K, V> | null; // Least recently used

    constructor(capacity: number) {
        if (!Number.isInteger(capacity) || capacity <= 0) {
            throw new Error("Capacity must be a positive integer");
        }
        this.capacity = capacity;
        this.map = new Map<K, ListNode<K, V>>();
        this.head = null;
        this.tail = null;
    }

    /**
     * Retrieves the value associated with the given key.
     * Moves the accessed node to the head (most-recently used).
     * Returns undefined if the key is not present.
     */
    get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) {
            return undefined;
        }
        this.moveToHead(node);
        return node.value;
    }

    /**
     * Inserts or updates the key-value pair.
     * If the key already exists, its value is updated and node moved to head.
     * If insertion exceeds capacity, the least-recently used entry is evicted.
     */
    put(key: K, value: V): void {
        const existingNode = this.map.get(key);
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

        this.map.set(key, newNode);
        this.addToHead(newNode);

        if (this.map.size > this.capacity) {
            this.evictTail();
        }
    }

    /**
     * Returns the current number of stored entries.
     * Primarily for testing/verification.
     */
    size(): number {
        return this.map.size;
    }

    /**
     * Internal helper: adds a node to the head of the linked list.
     */
    private addToHead(node: ListNode<K, V>): void {
        node.prev = null;
        node.next = this.head;
        if (this.head) {
            this.head.prev = node;
        }
        this.head = node;
        if (!this.tail) {
            // First node added
            this.tail = node;
        }
    }

    /**
     * Internal helper: removes a node from its current position.
     */
    private removeNode(node: ListNode<K, V>): void {
        const { prev, next } = node;
        if (prev) {
            prev.next = next;
        } else {
            // Node is head
            this.head = next;
        }
        if (next) {
            next.prev = prev;
        } else {
            // Node is tail
            this.tail = prev;
        }
        node.prev = null;
        node.next = null;
    }

    /**
     * Internal helper: moves an existing node to the head.
     */
    private moveToHead(node: ListNode<K, V>): void {
        if (node === this.head) {
            return; // Already most-recent
        }
        this.removeNode(node);
        this.addToHead(node);
    }

    /**
     * Internal helper: evicts the least-recently used node (tail).
     */
    private evictTail(): void {
        if (!this.tail) {
            return;
        }
        const evictKey = this.tail.key;
        this.removeNode(this.tail);
        this.map.delete(evictKey);
    }
}
