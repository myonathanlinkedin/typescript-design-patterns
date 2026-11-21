import { longestKRollerCoasterLength } from "./core";

function assertEqual(actual: any, expected: any, msg?: string): void {
    if (actual !== expected) {
        throw new Error(msg ?? `Assertion failed: expected ${expected}, got ${actual}`);
    }
}

// Test suite
function runTests(): void {
    // Empty array
    assertEqual(longestKRollerCoasterLength([], 0), 0, "Empty array");

    // Single element
    assertEqual(longestKRollerCoasterLength([42], 0), 1, "Single element");

    // No direction changes allowed (k = 0) – longest monotone subsequence
    // Example: [1,3,2,4,5] -> longest increasing subsequence length = 4
    assertEqual(longestKRollerCoasterLength([1, 3, 2, 4, 5], 0), 4, "k=0 LIS");

    // k = 1 – at most one change (i.e., one peak or valley)
    // Sequence can be increasing then decreasing or vice‑versa.
    // Example: [1,5,3,2,4] -> best is [1,5,3,2] length 4
    assertEqual(longestKRollerCoasterLength([1, 5, 3, 2, 4], 1), 4, "k=1 example");

    // k = 2 – two direction changes allowed
    // Example: alternating up/down pattern
    assertEqual(longestKRollerCoasterLength([1, 4, 2, 5, 3, 6], 2), 6, "k=2 full alternation");

    // All equal values – direction never changes, length = 1
    assertEqual(longestKRollerCoasterLength([7, 7, 7, 7], 3), 1, "All equal");

    // Decreasing sequence, k large – whole array is valid
    assertEqual(longestKRollerCoasterLength([9, 8, 7, 6, 5], 10), 5, "Monotone decreasing");

    // Random small test with brute‑force verification (exhaustive)
    const bruteForce = (a: number[], k: number): number => {
        const n = a.length;
        let best = 0;
        const dirs = (i: number, j: number) => (a[j] > a[i] ? 1 : a[j] < a[i] ? -1 : 0);
        const rec = (idx: number, lastIdx: number, changes: number, lastDir: number, len: number) => {
            if (len > best) best = len;
            for (let nxt = idx + 1; nxt < n; nxt++) {
                const d = dirs(lastIdx, nxt);
                if (d === 0) continue; // equal values do not contribute
                const newChanges = lastDir === 0 ? changes : changes + (d !== lastDir ? 1 : 0);
                if (newChanges <= k) rec(nxt, nxt, newChanges, d, len + 1);
            }
        };
        for (let start = 0; start < n; start++) {
            rec(start, start, 0, 0, 1);
        }
        return best;
    };

    const randomTest = () => {
        for (let seed = 0; seed < 50; seed++) {
            const len = 8;
            const arr = Array.from({ length: len }, () => Math.floor(Math.random() * 10));
            const k = Math.floor(Math.random() * 4);
            const expected = bruteForce(arr, k);
            const got = longestKRollerCoasterLength(arr, k);
            assertEqual(got, expected, `Random test failed on ${JSON.stringify(arr)} k=${k}`);
        }
    };
    randomTest();

    console.log("All tests passed.");
}

// Entry point
runTests();
