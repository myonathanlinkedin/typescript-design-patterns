/**
 * @file types.ts
 * @description Domain models, interfaces, and memory structs for the Copy-on-Write (COW) Vector Memory Buffer.
 * 
 * The COW pattern allows multiple references to share the same underlying memory buffer until a mutation occurs.
 * Upon mutation, the buffer is cloned (if shared), ensuring that other references remain unaffected.
 */

/**
 * Represents a single element in the vector buffer.
 * For this implementation, we use `number` as the generic payload type.
 */
export type VectorElement = number;

/**
 * Interface representing a reference to a COW buffer.
 * This is the handle that users interact with.
 */
export interface CowVectorRef {
    /** Unique identifier for this reference instance. */
    readonly id: string;
    /** The underlying shared buffer. */
    readonly buffer: CowBuffer;
    /** The logical length of the vector exposed by this reference. */
    readonly length: number;
}

/**
 * The core shared memory buffer.
 * Multiple `CowVectorRef` instances can point to the same `CowBuffer` instance.
 */
export class CowBuffer {
    /**
     * The actual data storage.
     * We use a fixed-size array internally to simulate memory pages,
     * but expose a dynamic logical length.
     */
    private data: VectorElement[];
    
    /**
     * Reference count: how many `CowVectorRef` instances currently share this buffer.
     * When this count is 1, mutations can be performed in-place.
     * When > 1, a copy must be made before mutation.
     */
    private refCount: number;

    /**
     * The logical length of the vector.
     * This may be less than `data.length` if the buffer has been shrunk logically
     * but not physically (optimization), or if it's a slice view.
     */
    private logicalLength: number;

    constructor(initialData: VectorElement[], initialRefCount: number = 1) {
        this.data = [...initialData];
        this.refCount = initialRefCount;
        this.logicalLength = initialData.length;
    }

    /**
     * Increments the reference count.
     * Called when a new reference is created from an existing one.
     */
    incrementRefCount(): void {
        this.refCount++;
    }

    /**
     * Decrements the reference count.
     * Called when a reference is discarded.
     * @returns true if the buffer should be garbage collected (refCount reaches 0).
     */
    decrementRefCount(): boolean {
        this.refCount--;
        if (this.refCount < 0) {
            throw new Error("Reference count underflow: buffer is not shared.");
        }
        return this.refCount === 0;
    }

    /**
     * Returns the current reference count.
     */
    getRefCount(): number {
        return this.refCount;
    }

    /**
     * Returns the logical length of the vector.
     */
    getLogicalLength(): number {
        return this.logicalLength;
    }

    /**
     * Returns the underlying data array (read-only view).
     * @internal
     */
    getData(): readonly VectorElement[] {
        return this.data;
    }

    /**
     * Sets a value at a specific index.
     * @internal
     */
    set(index: number, value: VectorElement): void {
        if (index < 0 || index >= this.logicalLength) {
            throw new RangeError(`Index ${index} out of bounds [0, ${this.logicalLength})`);
        }
        this.data[index] = value;
    }

    /**
     * Gets a value at a specific index.
     * @internal
     */
    get(index: number): VectorElement {
        if (index < 0 || index >= this.logicalLength) {
            throw new RangeError(`Index ${index} out of bounds [0, ${this.logicalLength})`);
        }
        return this.data[index];
    }

    /**
     * Pushes a new element to the end of the vector.
     * @internal
     */
    push(value: VectorElement): void {
        this.data[this.logicalLength] = value;
        this.logicalLength++;
    }

    /**
     * Pops the last element from the vector.
     * @internal
     */
    pop(): VectorElement {
        if (this.logicalLength === 0) {
            throw new Error("Cannot pop from an empty vector.");
        }
        this.logicalLength--;
        return this.data[this.logicalLength];
    }

    /**
     * Creates a deep copy of this buffer.
     * @internal
     */
    clone(): CowBuffer {
        const newData = this.data.slice(0, this.logicalLength);
        return new CowBuffer(newData, 1);
    }
}

/**
 * Statistics for tracking COW behavior.
 */
export interface CowStats {
    totalCopies: number;
    totalInPlaceMutations: number;
    totalReads: number;
    totalWrites: number;
}
