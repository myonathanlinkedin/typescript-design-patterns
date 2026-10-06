import { Node, LRUCacheInterface } from "./types";

export class LRUCache<K, V> implements LRUCacheInterface<K, V> {
    private readonly maxSize: number;
    private map: Map<K, Node<K, V>>;
    private head: Node<K, V>;
    private tail: Node<K, V>;
    private currentSize: number;

    constructor(capacity: number) {
        if (capacity <= 0) {
            throw new Error("Capacity must be greater than 0");
        }
        this.maxSize = capacity;
        this.map = new Map<K, Node<K, V>>();
        // Dummy head and tail nodes to simplify edge cases
        this.head = { key: null as any, value: null as any, prev: null, next: null };
        this.tail = { key: null as any, value: null as any, prev: null, next: null };
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.currentSize = 0;
    }

    get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) {
            return undefined;
        }
        this.moveToFront(node);
        return node.value;
    }

    put(key: K, value: V): void {
        const existing = this.map.get(key);
        if (existing) {
            existing.value = value;
            this.moveToFront(existing);
            return;
        }

        const newNode: Node<K, V> = { key, value, prev: null, next: null };
        this.addToFront(newNode);
        this.map.set(key, newNode);
        this.currentSize++;

        if (this.currentSize > this.maxSize) {
            this.evictLeastRecentlyUsed();
        }
    }

    delete(key: K): boolean {
        const node = this.map.get(key);
        if (!node) {
            return false;
        }
        this.removeNode(node);
        this.map.delete(key);
        this.currentSize--;
        return true;
    }

    size(): number {
        return this.currentSize;
    }

    capacity(): number {
        return this.maxSize;
    }

    // Internal helper methods
    private addToFront(node: Node<K, V>): void {
        node.next = this.head.next;
        node.prev = this.head;
        if (this.head.next) {
            this.head.next.prev = node;
        }
        this.head.next = node;
        if (!this.tail.prev) {
            this.tail.prev = node;
        }
    }

    private removeNode(node: Node<K, V>): void {
        if (node.prev) {
            node.prev.next = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        node.prev = null;
        node.next = null;
    }

    private moveToFront(node: Node<K, V>): void {
        this.removeNode(node);
        this.addToFront(node);
    }

    private evictLeastRecentlyUsed(): void {
        const lru = this.tail.prev;
        if (!lru || lru === this.head) {
            return;
        }
        this.removeNode(lru);
        this.map.delete(lru.key);
        this.currentSize--;
    }
}
