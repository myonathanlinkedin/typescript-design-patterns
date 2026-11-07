import { MemoryEntry, QueryResult } from "./types";

/**
 * Utility functions for vector operations.
 * All functions assume non‑empty vectors of equal length.
 */
function dot(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

function magnitude(v: number[]): number {
    return Math.sqrt(dot(v, v));
}

/**
 * Cosine similarity between two vectors.
 * Returns 0 when either vector has zero magnitude to avoid NaN.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Vector length mismatch");
    }
    const magA = magnitude(a);
    const magB = magnitude(b);
    if (magA === 0 || magB === 0) {
        return 0;
    }
    return dot(a, b) / (magA * magB);
}

/**
 * In‑memory latent semantic store.
 * Stores entries with fixed‑size embeddings and enables similarity search.
 */
export class MemoryStore<T = any> {
    /** Internal storage array */
    private entries: MemoryEntry<T>[] = [];
    /** Dimensionality of embeddings; set on first insertion */
    private dimension: number | null = null;

    /**
     * Insert or replace an entry.
     * @throws if embedding length mismatches existing dimension.
     */
    add(entry: MemoryEntry<T>): void {
        if (this.dimension === null) {
            this.dimension = entry.embedding.length;
        } else if (entry.embedding.length !== this.dimension) {
            throw new Error(
                `Embedding dimension mismatch: expected ${this.dimension}, got ${entry.embedding.length}`
            );
        }

        const idx = this.entries.findIndex(e => e.id === entry.id);
        if (idx >= 0) {
            // Replace existing entry
            this.entries[idx] = entry;
        } else {
            this.entries.push(entry);
        }
    }

    /**
     * Retrieve the top‑K most similar entries to the query embedding.
     * Returns an empty array when the store is empty.
     * @param query Embedding to compare against.
     * @param topK Number of results to return (must be >= 0).
     */
    query(query: number[], topK: number = 1): QueryResult<T>[] {
        if (topK < 0) {
            throw new Error("topK must be non‑negative");
        }
        if (this.dimension === null) {
            // Store is empty
            return [];
        }
        if (query.length !== this.dimension) {
            throw new Error(
                `Query embedding dimension mismatch: expected ${this.dimension}, got ${query.length}`
            );
        }

        const scored: QueryResult<T>[] = this.entries.map(e => ({
            id: e.id,
            data: e.data,
            similarity: cosineSimilarity(query, e.embedding),
        }));

        scored.sort((a, b) => b.similarity - a.similarity);
        return scored.slice(0, Math.min(topK, scored.length));
    }

    /** Expose current entry count (useful for tests). */
    size(): number {
        return this.entries.length;
    }

    /** Clear all stored entries. */
    clear(): void {
        this.entries = [];
        this.dimension = null;
    }
}
