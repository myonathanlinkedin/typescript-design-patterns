import { Comparator, Heap } from "./types";

export class MinHeap<T> implements Heap<T> {
    private data: T[] = [];
    private compare: Comparator<T>;

    constructor(comparator?: Comparator<T>) {
        // Default comparator works for numbers and strings
        this.compare = comparator ?? ((a: any, b: any) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });
    }

    insert(item: T): void {
        this.data.push(item);
        this.bubbleUp(this.data.length - 1);
    }

    extract(): T {
        if (this.isEmpty()) {
            throw new Error("Heap is empty");
        }
        const min = this.data[0];
        const last = this.data.pop()!;
        if (!this.isEmpty()) {
            this.data[0] = last;
            this.bubbleDown(0);
        }
        return min;
    }

    peek(): T | undefined {
        return this.data[0];
    }

    size(): number {
        return this.data.length;
    }

    isEmpty(): boolean {
        return this.data.length === 0;
    }

    private parent(index: number): number {
        return Math.floor((index - 1) / 2);
    }

    private leftChild(index: number): number {
        return index * 2 + 1;
    }

    private rightChild(index: number): number {
        return index * 2 + 2;
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIdx = this.parent(index);
            if (this.compare(this.data[index], this.data[parentIdx]) < 0) {
                this.swap(index, parentIdx);
                index = parentIdx;
            } else {
                break;
            }
        }
    }

    private bubbleDown(index: number): void {
        const length = this.data.length;
        while (true) {
            const leftIdx = this.leftChild(index);
            const rightIdx = this.rightChild(index);
            let smallest = index;

            if (leftIdx < length && this.compare(this.data[leftIdx], this.data[smallest]) < 0) {
                smallest = leftIdx;
            }
            if (rightIdx < length && this.compare(this.data[rightIdx], this.data[smallest]) < 0) {
                smallest = rightIdx;
            }
            if (smallest !== index) {
                this.swap(index, smallest);
                index = smallest;
            } else {
                break;
            }
        }
    }

    private swap(i: number, j: number): void {
        const temp = this.data[i];
        this.data[i] = this.data[j];
        this.data[j] = temp;
    }
}
