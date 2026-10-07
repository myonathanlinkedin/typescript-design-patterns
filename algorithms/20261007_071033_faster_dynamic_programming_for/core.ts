export type Covariance = {
    /** Diagonal entries a[i] for i = 0..n-1, must be > 0 */
    diag: number[];
    /** Off‑diagonal entries b[i] for i = 0..n-2, such that Σ[i,i+1] = Σ[i+1,i] = b[i] */
    offDiag: number[];
};

/**
 * Compute the natural logarithm of the determinant of a contiguous principal
 * sub‑matrix Σ[l..r] of a symmetric positive‑definite tridiagonal matrix.
 *
 * Uses the recurrence:
 *   d0 = a[l]
 *   d1 = a[l+1] * d0 - b[l]^2
 *   dk = a[l+k] * d_{k-1} - b[l+k-1]^2 * d_{k-2}
 *
 * Returns -Infinity if the determinant is non‑positive (should not happen for
 * a valid covariance matrix).
 */
export function logDetInterval(cov: Covariance, l: number, r: number): number {
    const { diag, offDiag } = cov;
    const len = r - l + 1;
    if (len <= 0) return -Infinity;

    let dPrevPrev = 1; // determinant of empty matrix
    let dPrev = diag[l];
    if (dPrev <= 0) return -Infinity;

    if (len === 1) return Math.log(dPrev);

    // k = 1 corresponds to second element (index l+1)
    let dCurr = diag[l + 1] * dPrev - offDiag[l] ** 2 * dPrevPrev;
    if (dCurr <= 0) return -Infinity;
    if (len === 2) return Math.log(dCurr);

    dPrevPrev = dPrev;
    dPrev = dCurr;

    for (let k = 2; k < len; ++k) {
        const i = l + k;
        dCurr = diag[i] * dPrev - offDiag[i - 1] ** 2 * dPrevPrev;
        if (dCurr <= 0) return -Infinity;
        dPrevPrev = dPrev;
        dPrev = dCurr;
    }
    return Math.log(dPrev);
}

/**
 * Pre‑compute log‑determinants for all contiguous intervals.
 * logDet[l][r] = log det Σ[l..r]  (undefined if l > r)
 */
export function precomputeLogDet(cov: Covariance): (number | undefined)[][] {
    const n = cov.diag.length;
    const logDet: (number | undefined)[][] = Array.from({ length: n }, () => Array(n).fill(undefined));
    for (let l = 0; l < n; ++l) {
        for (let r = l; r < n; ++r) {
            logDet[l][r] = logDetInterval(cov, l, r);
        }
    }
    return logDet;
}

/**
 * Dynamic programming to obtain the maximum log‑determinant of any principal
 * sub‑matrix formed by selecting exactly `k` rows/columns from a tridiagonal
 * covariance matrix.
 *
 * Returns -Infinity if selection is impossible.
 */
export function maxLogDetSelectK(cov: Covariance, k: number): number {
    const n = cov.diag.length;
    if (k < 0 || k > n) return -Infinity;
    if (k === 0) return 0; // empty set has determinant 1 => log 1 = 0

    const logDet = precomputeLogDet(cov);

    // dp[i][j] = best log‑det using first i+1 rows (0..i) selecting j elements,
    // where the last selected element is at position i (i is included).
    const dp: number[][] = Array.from({ length: n }, () => Array(k + 1).fill(-Infinity));

    // Initialise intervals that start at 0
    for (let r = 0; r < n; ++r) {
        const sz = r - 0 + 1;
        if (sz <= k && logDet[0][r] !== undefined) {
            dp[r][sz] = logDet[0][r]!;
        }
    }

    // Fill DP
    for (let i = 0; i < n; ++i) {
        for (let j = 1; j <= k; ++j) {
            if (dp[i][j] === -Infinity) continue;
            // Try to start a new block after i
            for (let nxt = i + 1; nxt < n; ++nxt) {
                const maxBlockSize = Math.min(k - j, n - nxt);
                for (let sz = 1; sz <= maxBlockSize; ++sz) {
                    const l = nxt;
                    const r = nxt + sz - 1;
                    const blockLog = logDet[l][r];
                    if (blockLog === undefined) continue;
                    const newJ = j + sz;
                    const cand = dp[i][j] + blockLog;
                    if (cand > dp[r][newJ]) dp[r][newJ] = cand;
                }
            }
        }
    }

    // Answer is the best value among dp[i][k] for any ending position i
    let best = -Infinity;
    for (let i = 0; i < n; ++i) {
        if (dp[i][k] > best) best = dp[i][k];
    }
    return best;
}

/**
 * Brute‑force enumeration for verification in tests.
 * Returns the maximum log‑determinant for selecting exactly k indices.
 */
export function bruteForceMaxLogDet(cov: Covariance, k: number): number {
    const n = cov.diag.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    let best = -Infinity;

    function* combos(start: number, left: number, cur: number[]): Generator<number[]> {
        if (left === 0) {
            yield cur.slice();
            return;
        }
        for (let i = start; i <= n - left; ++i) {
            cur.push(i);
            yield* combos(i + 1, left - 1, cur);
            cur.pop();
        }
    }

    // Helper to build the principal sub‑matrix and compute its log‑det via Gaussian elimination
    function logDetOfSet(set: number[]): number {
        const m = set.length;
        if (m === 0) return 0;
        const mat = Array.from({ length: m }, () => Array(m).fill(0));
        for (let i = 0; i < m; ++i) {
            const ii = set[i];
            mat[i][i] = cov.diag[ii];
            if (i > 0) {
                const prev = set[i - 1];
                if (ii === prev + 1) {
                    const off = cov.offDiag[prev];
                    mat[i][i - 1] = off;
                    mat[i - 1][i] = off;
                }
            }
        }
        // Gaussian elimination with partial pivoting (log‑det tracking)
        let sign = 1;
        let logDet = 0;
        for (let p = 0; p < m; ++p) {
            // pivot
            let maxRow = p;
            for (let r = p + 1; r < m; ++r) {
                if (Math.abs(mat[r][p]) > Math.abs(mat[maxRow][p])) maxRow = r;
            }
            if (Math.abs(mat[maxRow][p]) < 1e-12) return -Infinity;
            if (maxRow !== p) {
                [mat[p], mat[maxRow]] = [mat[maxRow], mat[p]];
                sign = -sign;
            }
            const pivot = mat[p][p];
            logDet += Math.log(Math.abs(pivot));
            for (let r = p + 1; r < m; ++r) {
                const factor = mat[r][p] / pivot;
                for (let c = p; c < m; ++c) {
                    mat[r][c] -= factor * mat[p][c];
                }
            }
        }
        return logDet + Math.log(sign);
    }

    for (const combo of combos(0, k, [])) {
        const val = logDetOfSet(combo);
        if (val > best) best = val;
    }
    return best;
}
