import { Matrix, Vector, BoundedILPProblem, BoundedILPSolution } from "./types";

/**
 * Solve a bounded integer linear feasibility problem:
 *   find x ∈ ℤⁿ such that A·x = b and lower ≤ x ≤ upper.
 *
 * The algorithm is a depth‑first branch‑and‑bound search with
 * interval pruning based on min/max possible contributions of the
 * yet‑unassigned variables.
 *
 * Time complexity is exponential in the number of variables in the
 * worst case, but the pruning is strong for small‑to‑moderate
 * instances and guarantees deterministic termination.
 */
export function solveBoundedILP(problem: BoundedILPProblem): BoundedILPSolution {
    const { A, b, lower, upper } = problem;
    const m = A.length;               // number of equations
    const n = (A[0] ?? []).length;    // number of variables

    // Basic dimension checks
    if (b.length !== m) {
        throw new Error("Dimension mismatch: b length must equal number of rows of A.");
    }
    if (lower.length !== n || upper.length !== n) {
        throw new Error("Dimension mismatch: bounds length must equal number of columns of A.");
    }
    for (let i = 0; i < m; ++i) {
        if (A[i].length !== n) {
            throw new Error(`Row ${i} of A does not have length ${n}.`);
        }
    }

    // Pre‑compute column vectors of A for fast updates
    const columns: Vector[] = Array.from({ length: n }, (_, j) => A.map(row => row[j]));

    // Variable ordering: smallest domain first improves pruning
    const varOrder = Array.from({ length: n }, (_, i) => i).sort((i, j) => {
        const sizeI = upper[i] - lower[i] + 1;
        const sizeJ = upper[j] - lower[j] + 1;
        return sizeI - sizeJ;
    });

    // Helper: compute min/max possible contribution of remaining vars to each equation
    function computeRemainingBounds(startIdx: number, assign: Vector): { min: Vector; max: Vector } {
        const min = new Array(m).fill(0);
        const max = new Array(m).fill(0);
        for (let idx = startIdx; idx < n; ++idx) {
            const varIdx = varOrder[idx];
            const col = columns[varIdx];
            const lo = lower[varIdx];
            const hi = upper[varIdx];
            for (let i = 0; i < m; ++i) {
                const coeff = col[i];
                if (coeff >= 0) {
                    min[i] += coeff * lo;
                    max[i] += coeff * hi;
                } else {
                    // coeff < 0 flips the effect of bounds
                    min[i] += coeff * hi;
                    max[i] += coeff * lo;
                }
            }
        }
        return { min, max };
    }

    // Recursive depth‑first search
    const solution: Vector = new Array(n).fill(0);
    const partialAx = new Array(m).fill(0);
    let found = false;

    function dfs(depth: number): void {
        if (found) return; // early exit once a solution is discovered
        if (depth === n) {
            // All variables assigned – check exact equality
            for (let i = 0; i < m; ++i) {
                if (partialAx[i] !== b[i]) return;
            }
            // Copy solution respecting original variable order
            for (let idx = 0; idx < n; ++idx) {
                const varIdx = varOrder[idx];
                solution[varIdx] = solution[varIdx]; // already stored
            }
            found = true;
            return;
        }

        const varIdx = varOrder[depth];
        const col = columns[varIdx];
        const lo = lower[varIdx];
        const hi = upper[varIdx];

        // Compute remaining contribution bounds for pruning
        const { min: remMin, max: remMax } = computeRemainingBounds(depth + 1, solution);

        for (let val = lo; val <= hi; ++val) {
            // Update partialAx with contribution of current variable
            for (let i = 0; i < m; ++i) {
                partialAx[i] += col[i] * val;
            }
            solution[varIdx] = val;

            // Prune: for each equation, check if b[i] can still be reached
            let feasible = true;
            for (let i = 0; i < m; ++i) {
                const minPossible = partialAx[i] + remMin[i];
                const maxPossible = partialAx[i] + remMax[i];
                if (b[i] < minPossible || b[i] > maxPossible) {
                    feasible = false;
                    break;
                }
            }

            if (feasible) {
                dfs(depth + 1);
                if (found) return;
            }

            // Backtrack partialAx
            for (let i = 0; i < m; ++i) {
                partialAx[i] -= col[i] * val;
            }
        }
    }

    dfs(0);

    if (found) {
        // Ensure solution vector respects original ordering (already does)
        return { feasible: true, x: solution.slice() };
    } else {
        return { feasible: false };
    }
}
