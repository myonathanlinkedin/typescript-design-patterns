export interface Node<K, V> {
    key: K;
    value: V;
    prev: Node<K, V> | null;
    next: Node<K, V> | null;
}

export interface LRUCacheInterface<K, V> {
    get(key: K): V | undefined;
    put(key: K, value: V): void;
    delete(key: K): boolean;
    size(): number;
    capacity(): number;
}
