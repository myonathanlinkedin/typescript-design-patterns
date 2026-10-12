import { Comparator, Heap } from "./types";

/**
 * BinaryHeap implements a generic binary heap with a custom comparator.
 * Time Complexity:
 *  - push: O(log n)
 *  - pop: O(log n)
 *  - peek: O(1)
 * Space Complexity: O(n)
 */
export class BinaryHeap<T> implements Heap<T> {
    private data: T[] = [];
    private cmp: Comparator<T>;

    constructor(comparator: Comparator<T>) {
        this.cmp = comparator;
    }

    size(): number {
        return this.data.length;
    }

    peek(): T | undefined {
        return this.data[0];
    }

    push(item: T): void {
        this.data.push(item);
        this.bubbleUp(this.data.length - 1);
    }

    pop(): T | undefined {
        if (this.data.length === 0) return undefined;
        const top = this.data[0];
        const last = this.data.pop()!;
        if (this.data.length > 0) {
            this.data[0] = last;
            this.bubbleDown(0);
        }
        return top;
    }

    private parent(idx: number): number {
        return Math.floor((idx - 1) / 2);
    }

    private leftChild(idx: number): number {
        return idx * 2 + 1;
    }

    private rightChild(idx: number): number {
        return idx * 2 + 2;
    }

    private bubbleUp(idx: number): void {
        while (idx > 0) {
            const p = this.parent(idx);
            if (this.cmp(this.data[idx], this.data[p]) < 0) {
                [this.data[idx], this.data[p]] = [this.data[p], this.data[idx]];
                idx = p;
            } else {
                break;
            }
        }
    }

    private bubbleDown(idx: number): void {
        const n = this.data.length;
        while (true) {
            const left = this.leftChild(idx);
            const right = this.rightChild(idx);
            let smallest = idx;

            if (left < n && this.cmp(this.data[left], this.data[smallest]) < 0) {
                smallest = left;
            }
            if (right < n && this.cmp(this.data[right], this.data[smallest]) < 0) {
                smallest = right;
            }
            if (smallest !== idx) {
                [this.data[idx], this.data[smallest]] = [this.data[smallest], this.data[idx]];
                idx = smallest;
            } else {
                break;
            }
        }
    }
}

/**
 * Faststream maintains a dynamic median of a numeric stream.
 * All operations are O(log n) time, O(n) space.
 */
export class Faststream {
    private lower: BinaryHeap<number>; // max-heap (store negatives to reuse min-heap logic)
    private upper: BinaryHeap<number>; // min-heap

    constructor() {
        // Max-heap via reversed comparator
        this.lower = new BinaryHeap<number>((a, b) => b - a);
        this.upper = new BinaryHeap<number>((a, b) => a - b);
    }

    /**
     * Inserts a new number into the stream.
     */
    add(value: number): void {
        if (this.lower.size() === 0 || value <= (this.lower.peek() as number)) {
            this.lower.push(value);
        } else {
            this.upper.push(value);
        }
        this.rebalance();
    }

    /**
     * Returns the current median.
     * - If no elements have been added, returns null.
     * - If odd count, returns the middle element.
     * - If even count, returns the arithmetic mean of the two middle elements.
     */
    getMedian(): number | null {
        const total = this.lower.size() + this.upper.size();
        if (total === 0) return null;
        if (total % 2 === 1) {
            // lower heap always holds the extra element when odd
            return this.lower.peek() as number;
        } else {
            const lowTop = this.lower.peek() as number;
            const highTop = this.upper.peek() as number;
            return (lowTop + highTop) / 2;
        }
    }

    /**
     * Internal method to keep size invariant:
     *   lower.size() == upper.size()   or   lower.size() == upper.size() + 1
     */
    private rebalance(): void {
        if (this.lower.size() > this.upper.size() + 1) {
            const moved = this.lower.pop() as number;
            this.upper.push(moved);
        } else if (this.upper.size() > this.lower.size()) {
            const moved = this.upper.pop() as number;
            this.lower.push(moved);
        }
    }

    /**
     * Exposes internal heap sizes for testing invariants.
     */
    _debugSizes(): { lower: number; upper: number } {
        return { lower: this.lower.size(), upper: this.upper.size() };
    }

    /**
     * Checks internal ordering invariant:
     *   every element in lower <= every element in upper.
     */
    _checkOrderingInvariant(): boolean {
        if (this.lower.size() === 0 || this.upper.size() === 0) return true;
        const maxLower = this.lower.peek() as number;
        const minUpper = this.upper.peek() as number;
        return maxLower <= minUpper;
    }
}
