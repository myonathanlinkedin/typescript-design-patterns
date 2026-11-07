export interface MemoryEntry<T = any> {
    /** Unique identifier for the entry */
    id: string;
    /** Fixed‑length embedding vector */
    embedding: number[];
    /** Payload associated with the entry */
    data: T;
}

export interface QueryResult<T = any> {
    /** Identifier of the matched entry */
    id: string;
    /** Payload of the matched entry */
    data: T;
    /** Cosine similarity score in the range [-1, 1] */
    similarity: number;
}
