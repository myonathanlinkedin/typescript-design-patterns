import { BoundedILPProblem } from "./types";
import { solveBoundedILP } from "./engine";

/**
 * Simple assertion helper that throws on failure.
 */
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

/**
 * Verify that a solution satisfies all constraints of the problem.
 */
function verifySolution(problem: BoundedILPProblem, solution: number[]): void {
    const { A, b, lower, upper } = problem;
    const m = A.length;
    const n = solution.length;

    // Bounds check
    for (let j = 0; j < n; ++j) {
        assert(Number.isInteger(solution[j]), `Variable x[${j}] is not integer`);
        assert(solution[j] >= lower[j] && solution[j] <= upper[j],
            `Variable x[${j}] = ${solution[j]} violates bounds [${lower[j]}, ${upper[j]}]`);
    }

    // Equation check
    for (let i = 0; i < m; ++i) {
        let sum = 0;
        for (let j = 0; j < n; ++j) {
            sum += A[i][j] * solution[j];
        }
        assert(sum === b[i],
            `Equation ${i} violated: Σ A[i][j]·x[j] = ${sum}, expected ${b[i]}`);
    }
}

/* ---------- Test Suite ---------- */

// 1. Simple single‑equation bounded knapsack
(() => {
    const problem: BoundedILPProblem = {
        A: [[1, 1]],
        b: [5],
        lower: [0, 0],
        upper: [5, 5],
    };
    const result = solveBoundedILP(problem);
    assert(result.feasible, "Test 1 should be feasible");
    assert(result.x !== undefined, "Resulting vector must be defined");
    verifySolution(problem, result.x!);
    // Additional sanity: sum must be 5
    assert(result.x![0] + result.x![1] === 5, "Sum of variables must equal 5");
})();

// 2. Infeasible due to bounds
(() => {
    const problem: BoundedILPProblem = {
        A: [[2, 3]],
        b: [1],
        lower: [0, 0],
        upper: [10, 10],
    };
    const result = solveBoundedILP(problem);
    assert(!result.feasible, "Test 2 must be infeasible");
})();

// 3. Two equations, three variables
(() => {
    const problem: BoundedILPProblem = {
        A: [
            [1, 2, 1],
            [0, 1, 3],
        ],
        b: [7, 8],
        lower: [0, 0, 0],
        upper: [5, 5, 5],
    };
    const result = solveBoundedILP(problem);
    assert(result.feasible && result.x !== undefined, "Test 3 should be feasible");
    verifySolution(problem, result.x!);
})();

// 4. Edge case: zero variables, zero equations (trivially feasible)
(() => {
    const problem: BoundedILPProblem = {
        A: [],
        b: [],
        lower: [],
        upper: [],
    };
    const result = solveBoundedILP(problem);
    assert(result.feasible, "Test 4 (empty problem) should be feasible");
    assert(result.x?.length === 0, "Solution vector should be empty");
})();

// 5. Edge case: zero variables but non‑zero equations (infeasible)
(() => {
    const problem: BoundedILPProblem = {
        A: [[1, 2]],
        b: [3],
        lower: [],
        upper: [],
    };
    const result = solveBoundedILP(problem);
    assert(!result.feasible, "Test 5 must be infeasible (no variables to satisfy equation)");
})();

// 6. Larger domain but still solvable
(() => {
    const problem: BoundedILPProblem = {
        A: [[1, 4, 5]],
        b: [27],
        lower: [0, 0, 0],
        upper: [10, 10, 10],
    };
    const result = solveBoundedILP(problem);
    assert(result.feasible && result.x !== undefined, "Test 6 should be feasible");
    verifySolution(problem, result.x!);
})();

console.log("All tests passed.");
