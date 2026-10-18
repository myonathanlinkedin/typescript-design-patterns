export class LRUCache<K, V> {
    private capacity: number;
    private map: Map<K, Node<K, V>>;
    private head: Node<K, V>; // most recent
    private tail: Node<K, V>; // least recent
    private _size: number = 0;

    constructor(capacity: number) {
        if (capacity < 0) {
            throw new Error('Capacity must be non‑negative');
        }
        this.capacity = capacity;
        this.map = new Map();

        // sentinel nodes simplify insert/remove logic
        this.head = new Node<K, V>(null as any, null as any);
        this.tail = new Node<K, V>(null as any, null as any);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    /** Return current number of stored entries */
    size(): number {
        return this._size;
    }

    /** Retrieve value associated with key, promoting it to most‑recent */
    get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) return undefined;
        this.moveToFront(node);
        return node.value;
    }

    /** Insert or update key with value. Evicts LRU entry if over capacity. */
    put(key: K, value: V): void {
        if (this.capacity === 0) return; // degenerate cache

        const existing = this.map.get(key);
        if (existing) {
            existing.value = value;
            this.moveToFront(existing);
            return;
        }

        const node = new Node(key, value);
        this.map.set(key, node);
        this.insertAfter(this.head, node);
        this._size++;

        if (this._size > this.capacity) {
            this.evictLRU();
        }
    }

    /** Return keys ordered from most‑recent to least‑recent */
    keys(): K[] {
        const result: K[] = [];
        let cur = this.head.next;
        while (cur && cur !== this.tail) {
            result.push(cur.key);
            cur = cur.next;
        }
        return result;
    }

    /** Internal: move node to front (right after head) */
    private moveToFront(node: Node<K, V>): void {
        this.remove(node);
        this.insertAfter(this.head, node);
    }

    /** Internal: evict least‑recently used node (right before tail) */
    private evictLRU(): void {
        const lru = this.tail.prev;
        if (lru && lru !== this.head) {
            this.remove(lru);
            this.map.delete(lru.key);
            this._size--;
        }
    }

    /** Internal: unlink node from list */
    private remove(node: Node<K, V>): void {
        const prev = node.prev!;
        const next = node.next!;
        prev.next = next;
        next.prev = prev;
        node.prev = null;
        node.next = null;
    }

    /** Internal: insert node after a given anchor */
    private insertAfter(anchor: Node<K, V>, node: Node<K, V>): void {
        const next = anchor.next!;
        node.prev = anchor;
        node.next = next;
        anchor.next = node;
        next.prev = node;
    }
}

/** Doubly linked list node */
class Node<K, V> {
    key: K;
    value: V;
    prev: Node<K, V> | null = null;
    next: Node<K, V> | null = null;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}
