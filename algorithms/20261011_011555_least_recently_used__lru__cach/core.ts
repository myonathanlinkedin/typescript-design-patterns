export class LRUCache<K, V> {
    private capacity: number;
    private map: Map<K, ListNode<K, V>>;
    private head: ListNode<K, V> | null = null; // Most recently used
    private tail: ListNode<K, V> | null = null; // Least recently used

    constructor(capacity: number) {
        if (capacity < 0) {
            throw new Error('Capacity must be non‑negative');
        }
        this.capacity = capacity;
        this.map = new Map();
    }

    /** Retrieve a value and mark its entry as most‑recently used. */
    get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) return undefined;
        this.moveToHead(node);
        return node.value;
    }

    /** Insert or update a value. Evicts least‑recently used entry if needed. */
    put(key: K, value: V): void {
        const existing = this.map.get(key);
        if (existing) {
            existing.value = value;
            this.moveToHead(existing);
            return;
        }

        const node = new ListNode(key, value);
        this.map.set(key, node);
        this.addToHead(node);

        if (this.map.size > this.capacity) {
            this.evictTail();
        }
    }

    /** Current number of stored entries. */
    size(): number {
        return this.map.size;
    }

    /** Return keys ordered from most‑recently used to least‑recently used. */
    keys(): K[] {
        const result: K[] = [];
        let cur = this.head;
        while (cur) {
            result.push(cur.key);
            cur = cur.next;
        }
        return result;
    }

    /** Internal: move a node to the head of the list. */
    private moveToHead(node: ListNode<K, V>): void {
        if (node === this.head) return;
        this.removeNode(node);
        this.addToHead(node);
    }

    /** Internal: prepend node to the head. */
    private addToHead(node: ListNode<K, V>): void {
        node.prev = null;
        node.next = this.head;
        if (this.head) this.head.prev = node;
        this.head = node;
        if (!this.tail) this.tail = node;
    }

    /** Internal: unlink a node from its current position. */
    private removeNode(node: ListNode<K, V>): void {
        if (node.prev) node.prev.next = node.next;
        else this.head = node.next;

        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;

        node.prev = null;
        node.next = null;
    }

    /** Internal: evict the least‑recently used node (the tail). */
    private evictTail(): void {
        if (!this.tail) return;
        const evictedKey = this.tail.key;
        this.removeNode(this.tail);
        this.map.delete(evictedKey);
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
