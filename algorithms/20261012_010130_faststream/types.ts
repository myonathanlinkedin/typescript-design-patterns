export interface Comparator<T> {
    (a: T, b: T): number; // negative if a < b, zero if equal, positive if a > b
}

export interface Heap<T> {
    size(): number;
    peek(): T | undefined;
    push(item: T): void;
    pop(): T | undefined;
}
