export type Comparator<T> = (a: T, b: T) => number;

export interface Heap<T> {
    insert(item: T): void;
    extract(): T;
    peek(): T | undefined;
    size(): number;
    isEmpty(): boolean;
}
