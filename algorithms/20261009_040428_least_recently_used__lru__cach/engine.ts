import { ListNode } from "./types";

export class LRUCache<K, V> {
    private readonly capacity: number;
    private readonly map: Map<K, ListNode<K, V>> = new Map();
    private head: ListNode<K, V> | null = null; // Most recently used
    private tail: ListNode<K, V> | null = null; // Least recently used

    constructor(capacity: number) {
        if (!Number.isInteger(capacity) || capacity < 0) {
            throw new Error("Capacity must be a non‑negative integer");
        }
        this.capacity = capacity;
    }

    /** Retrieve a value and mark its node as most‑recently used. */
    get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) {
            return undefined;
        }
        this.moveToHead(node);
        return node.value;
    }

    /** Insert or update a key/value pair. Evicts LRU entry if over capacity. */
    put(key: K, value: V): void {
        if (this.capacity === 0) {
            // Cache disabled – ignore all puts.
            return;
        }

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
        this.addNodeToHead(newNode);

        if (this.map.size > this.capacity) {
            const tailNode = this.removeTail();
            if (tailNode) {
                this.map.delete(tailNode.key);
            }
        }
    }

    /** Current number of stored entries. */
    size(): number {
        return this.map.size;
    }

    /** Internal: prepend node to the head of the doubly linked list. */
    private addNodeToHead(node: ListNode<K, V>): void {
        node.prev = null;
        node.next = this.head;
        if (this.head) {
            this.head.prev = node;
        }
        this.head = node;
        if (!this.tail) {
            // First node becomes both head and tail.
            this.tail = node;
        }
    }

    /** Internal: detach a node from its current position. */
    private detachNode(node: ListNode<K, V>): void {
        const { prev, next } = node;
        if (prev) {
            prev.next = next;
        } else {
            // Node is head.
            this.head = next;
        }
        if (next) {
            next.prev = prev;
        } else {
            // Node is tail.
            this.tail = prev;
        }
        node.prev = null;
        node.next = null;
    }

    /** Internal: move an existing node to the head (most‑recent). */
    private moveToHead(node: ListNode<K, V>): void {
        if (node === this.head) {
            return; // Already most‑recent.
        }
        this.detachNode(node);
        this.addNodeToHead(node);
    }

    /** Internal: remove the tail node (least‑recent) and return it. */
    private removeTail(): ListNode<K, V> | null {
        if (!this.tail) {
            return null;
        }
        const oldTail = this.tail;
        this.detachNode(oldTail);
        return oldTail;
    }
}
