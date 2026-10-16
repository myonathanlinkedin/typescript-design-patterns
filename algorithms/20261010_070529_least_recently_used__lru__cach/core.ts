export class LRUCache<K, V> {
    private capacity: number;
    private map: Map<K, ListNode<K, V>>;
    private head: ListNode<K, V>; // most recently used
    private tail: ListNode<K, V>; // least recently used

    constructor(capacity: number) {
        if (!Number.isInteger(capacity) || capacity <= 0) {
            throw new Error('Capacity must be a positive integer');
        }
        this.capacity = capacity;
        this.map = new Map();

        // sentinel nodes simplify add/remove logic
        this.head = new ListNode<K, V>(null as any, null as any);
        this.tail = new ListNode<K, V>(null as any, null as any);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    /** Retrieve value associated with key, or undefined if absent. */
    get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) return undefined;
        this.moveToHead(node);
        return node.value;
    }

    /** Insert or update the key/value pair. Evicts LRU entry if over capacity. */
    put(key: K, value: V): void {
        let node = this.map.get(key);
        if (node) {
            node.value = value;
            this.moveToHead(node);
        } else {
            node = new ListNode(key, value);
            this.map.set(key, node);
            this.addNode(node);
            if (this.map.size > this.capacity) {
                const lru = this.tail.prev!;
                this.removeNode(lru);
                this.map.delete(lru.key);
            }
        }
    }

    /** Current number of stored entries. */
    size(): number {
        return this.map.size;
    }

    /** Internal: detach node from its current position. */
    private removeNode(node: ListNode<K, V>): void {
        const prev = node.prev!;
        const next = node.next!;
        prev.next = next;
        next.prev = prev;
        node.prev = null;
        node.next = null;
    }

    /** Internal: insert node right after head (most recent position). */
    private addNode(node: ListNode<K, V>): void {
        node.prev = this.head;
        node.next = this.head.next;
        this.head.next!.prev = node;
        this.head.next = node;
    }

    /** Internal: move an existing node to the most-recent position. */
    private moveToHead(node: ListNode<K, V>): void {
        this.removeNode(node);
        this.addNode(node);
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
