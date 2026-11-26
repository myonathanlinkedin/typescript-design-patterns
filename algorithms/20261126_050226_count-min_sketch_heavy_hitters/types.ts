export interface CountMinSketchParams {
    /** Width of the sketch (number of columns). Must be > 0. */
    width: number;
    /** Depth of the sketch (number of hash functions / rows). Must be > 0. */
    depth: number;
}

/** Result of a heavy‑hitter query: item and its estimated frequency. */
export interface HeavyHitter {
    item: string;
    estimate: number;
}
