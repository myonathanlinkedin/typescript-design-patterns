export function longestKRollerCoasterLength(arr: number[], k: number): number {
    if (k < 0) throw new Error("k must be non‑negative");
    const n = arr.length;
    if (n === 0) return 0;
    // Coordinate compression
    const sorted = Array.from(new Set(arr)).sort((a, b) => a - b);
    const rank = new Map<number, number>();
    sorted.forEach((v, i) => rank.set(v, i + 1)); // 1‑based
    const m = sorted.length;

    // Fenwick tree that stores (length, index) pairs for max queries
    class Fenwick {
        size: number;
        len: number[];
        idx: number[];
        constructor(size: number) {
            this.size = size;
            this.len = new Array(size + 1).fill(0);
            this.idx = new Array(size + 1).fill(-1);
        }
        // keep the pair with larger length (break ties by smaller index)
        private better(l1: number, i1: number, l2: number, i2: number): [number, number] {
            if (l1 > l2) return [l1, i1];
            if (l2 > l1) return [l2, i2];
            return i1 < i2 ? [l1, i1] : [l2, i2];
        }
        update(pos: number, length: number, index: number): void {
            for (let i = pos; i <= this.size; i += i & -i) {
                const [bl, bi] = this.better(this.len[i], this.idx[i], length, index);
                this.len[i] = bl;
                this.idx[i] = bi;
            }
        }
        // max over [1..pos]
        query(pos: number): [number, number] {
            let bestLen = 0, bestIdx = -1;
            for (let i = pos; i > 0; i -= i & -i) {
                const [bl, bi] = this.better(bestLen, bestIdx, this.len[i], this.idx[i]);
                bestLen = bl;
                bestIdx = bi;
            }
            return [bestLen, bestIdx];
        }
        // max over [pos..size] using reversed indexing
        querySuffix(pos: number): [number, number] {
            // transform to prefix on reversed index
            const revPos = this.size - pos + 1;
            return this.query(revPos);
        }
    }

    // One Fenwick per (c, direction). direction 0 = up, 1 = down.
    const upFenwicks: Fenwick[] = Array.from({ length: k + 1 }, () => new Fenwick(m));
    const downFenwicks: Fenwick[] = Array.from({ length: k + 1 }, () => new Fenwick(m));

    // DP tables for reconstruction (optional, not used for length only)
    const upLen = Array.from({ length: n }, () => new Array(k + 1).fill(0));
    const downLen = Array.from({ length: n }, () => new Array(k + 1).fill(0));

    let globalBest = 0;

    for (let i = 0; i < n; i++) {
        const v = rank.get(arr[i])!; // compressed value, 1‑based
        const revV = m - v + 1; // reversed index for suffix queries

        // temporary storage to avoid intra‑element interference
        const tmpUp = new Array(k + 1).fill(0);
        const tmpDown = new Array(k + 1).fill(0);

        for (let c = 0; c <= k; c++) {
            // ----- compute best length ending with an UP step -----
            // same direction (previous up, no change)
            const [sameUpLen] = upFenwicks[c].query(v - 1);
            // change direction from down to up (uses one change)
            const [changeUpLen] = c > 0 ? downFenwicks[c - 1].query(v - 1) : [0, -1];
            const bestUpPrev = Math.max(sameUpLen, changeUpLen);
            const curUp = bestUpPrev + 1;
            tmpUp[c] = curUp;
            upLen[i][c] = curUp;

            // ----- compute best length ending with a DOWN step -----
            // same direction (previous down, no change)
            const [sameDownLen] = downFenwicks[c].querySuffix(v + 1);
            // change direction from up to down (uses one change)
            const [changeDownLen] = c > 0 ? upFenwicks[c - 1].querySuffix(v + 1) : [0, -1];
            const bestDownPrev = Math.max(sameDownLen, changeDownLen);
            const curDown = bestDownPrev + 1;
            tmpDown[c] = curDown;
            downLen[i][c] = curDown;

            // update global answer
            if (curUp > globalBest) globalBest = curUp;
            if (curDown > globalBest) globalBest = curDown;
        }

        // now commit updates to Fenwick structures
        for (let c = 0; c <= k; c++) {
            upFenwicks[c].update(v, tmpUp[c], i);
            downFenwicks[c].update(revV, tmpDown[c], i);
        }
    }

    return globalBest;
}
