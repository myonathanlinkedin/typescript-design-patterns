export interface BoundedItem {
    weight: number;   // non‑negative integer weight
    value: number;    // non‑negative integer value
    bound: number;    // maximum number of copies (>=0)
}

/**
 * Solves the bounded integer knapsack problem:
 *   maximize total value subject to total weight ≤ capacity,
 *   each item i can be taken at most bound_i times.
 *
 * Time   : O(N * C) where N = number of items, C = capacity,
 *          using monotone‑queue optimisation per residue class.
 * Space  : O(C) for two DP rows.
 *
 * @param items   Array of bounded items (weight, value, bound)
 * @param capacity Maximum allowed total weight (non‑negative integer)
 * @returns Maximum achievable total value (0 if capacity = 0)
 */
export function solveBoundedKnapsack(items: BoundedItem[], capacity: number): number {
    if (capacity < 0) {
        throw new Error('Capacity must be non‑negative');
    }
    const dpPrev = new Float64Array(capacity + 1);
    const dpCurr = new Float64Array(capacity + 1);
    // Initialise: value 0 achievable with weight 0; others impossible
    for (let w = 1; w <= capacity; ++w) {
        dpPrev[w] = -Infinity;
    }

    for (const { weight: w, value: v, bound: b } of items) {
        if (w === 0) {
            // Zero‑weight items can be taken up to bound without affecting capacity.
            // Their contribution is simply added to all reachable states.
            const add = Math.min(b, Number.MAX_SAFE_INTEGER) * v;
            for (let j = 0; j <= capacity; ++j) {
                if (dpPrev[j] > -Infinity) {
                    dpPrev[j] += add;
                }
            }
            continue;
        }
        // Process each residue class modulo w
        for (let r = 0; r < w; ++r) {
            // Deque stores indices m (where j = r + m*w) in increasing order
            const deque: number[] = [];
            // Iterate over all j = r + m*w within capacity
            for (let m = 0, j = r; j <= capacity; ++m, j += w) {
                const curVal = dpPrev[j] - m * v;
                // Maintain decreasing order of curVal in deque
                while (deque.length > 0) {
                    const lastM = deque[deque.length - 1];
                    const lastVal = dpPrev[r + lastM * w] - lastM * v;
                    if (lastVal <= curVal) {
                        deque.pop();
                    } else {
                        break;
                    }
                }
                deque.push(m);
                // Remove elements that exceed the bound window
                while (deque.length > 0 && deque[0] < m - b) {
                    deque.shift();
                }
                // Front of deque gives optimal previous state
                const bestM = deque[0];
                const bestIdx = r + bestM * w;
                dpCurr[j] = dpPrev[bestIdx] + (m - bestM) * v;
            }
        }
        // Swap dpPrev and dpCurr for next iteration
        dpPrev.set(dpCurr);
    }

    // The answer is the maximum value among all feasible weights ≤ capacity
    let answer = -Infinity;
    for (let w = 0; w <= capacity; ++w) {
        if (dpPrev[w] > answer) {
            answer = dpPrev[w];
        }
    }
    // If no combination is feasible (should not happen because weight 0 is always feasible)
    return answer === -Infinity ? 0 : answer;
}
