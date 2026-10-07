import { Covariance, maxLogDetSelectK, bruteForceMaxLogDet } from "./core";

// Simple assertion helper
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error("Assertion failed: " + message);
    }
}

// Test 1: tiny 3×3 matrix, k = 2
(function testTiny() {
    const cov: Covariance = {
        diag: [2, 3, 4],
        offDiag: [0.5, 0.8],
    };
    const k = 2;
    const dp = maxLogDetSelectK(cov, k);
    const brute = bruteForceMaxLogDet(cov, k);
    assert(Math.abs(dp - brute) < 1e-9, "tiny matrix DP vs brute mismatch");
})();

// Test 2: random 6×6 matrix, compare for all k
(function testRandom() {
    const n = 6;
    const diag = [5, 4, 6, 5, 7, 5];
    const offDiag = [0.3, 0.4, 0.2, 0.5, 0.3];
    const cov: Covariance = { diag, offDiag };
    for (let k = 0; k <= n; ++k) {
        const dp = maxLogDetSelectK(cov, k);
        const brute = bruteForceMaxLogDet(cov, k);
        assert(Math.abs(dp - brute) < 1e-9, `random matrix k=${k} mismatch`);
    }
})();

// Test 3: edge cases
(function testEdges() {
    const cov: Covariance = {
        diag: [1],
        offDiag: [],
    };
    assert(maxLogDetSelectK(cov, 0) === 0, "k=0 should be 0");
    assert(Math.abs(maxLogDetSelectK(cov, 1) - Math.log(1)) < 1e-12, "single element");
    assert(maxLogDetSelectK(cov, 2) === -Infinity, "k>n impossible");
})();

// Benchmark (lightweight)
(function benchmark() {
    const n = 100;
    const diag = Array.from({ length: n }, () => 2 + Math.random());
    const offDiag = Array.from({ length: n - 1 }, () => 0.1 + Math.random() * 0.4);
    const cov: Covariance = { diag, offDiag };
    const k = 30;
    const start = Date.now();
    const result = maxLogDetSelectK(cov, k);
    const elapsed = Date.now() - start;
    console.log(`Benchmark: n=${n}, k=${k}, time=${elapsed}ms, logDet=${result.toFixed(4)}`);
})();

console.log("All tests passed.");
