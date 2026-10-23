export class LRUCache<K, V> {
    private capacity: number;
    private map: Map<K, ListNode<K, V>>;
    private list: DoublyLinkedList<K, V>;

    constructor(capacity: number) {
        if (capacity < 0) {
            throw new Error('Capacity must be non‑negative');
        }
        this.capacity = capacity;
        this.map = new Map();
        this.list = new DoublyLinkedList<K, V>();
    }

    /** Retrieve a value and mark its entry as most‑recently used. */
    get(key: K): V | undefined {
        const node = this.map.get(key);
        if (!node) return undefined;
        this.list.moveToFront(node);
        return node.value;
    }

    /** Insert or update a value. Evicts least‑recently used entry if needed. */
    put(key: K, value: V): void {
        if (this.capacity === 0) return; // No storage allowed.

        const existing = this.map.get(key);
        if (existing) {
            existing.value = value;
            this.list.moveToFront(existing);
            return;
        }

        if (this.map.size >= this.capacity) {
            const lru = this.list.removeTail();
            if (lru) this.map.delete(lru.key);
        }

        const node = new ListNode(key, value);
        this.list.addFront(node);
        this.map.set(key, node);
    }

    /** Current number of stored entries. */
    size(): number {
        return this.map.size;
    }

    /** Remove all entries. */
    clear(): void {
        this.map.clear();
        this.list.clear();
    }
}

/* Internal doubly linked list implementation */
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

class DoublyLinkedList<K, V> {
    private head: ListNode<K, V>; // dummy head
    private tail: ListNode<K, V>; // dummy tail

    constructor() {
        this.head = new ListNode<K, V>(null as any, null as any);
        this.tail = new ListNode<K, V>(null as any, null as any);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    addFront(node: ListNode<K, V>): void {
        node.next = this.head.next;
        node.prev = this.head;
        if (this.head.next) this.head.next.prev = node;
        this.head.next = node;
    }

    moveToFront(node: ListNode<K, V>): void {
        this.remove(node);
        this.addFront(node);
    }

    remove(node: ListNode<K, V>): void {
        if (node.prev) node.prev.next = node.next;
        if (node.next) node.next.prev = node.prev;
        node.prev = null;
        node.next = null;
    }

    removeTail(): ListNode<K, V> | null {
        const node = this.tail.prev;
        if (node && node !== this.head) {
            this.remove(node);
            return node;
        }
        return null;
    }

    clear(): void {
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
}
