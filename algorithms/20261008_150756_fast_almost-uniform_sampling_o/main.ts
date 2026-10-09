import { CNFFormula, Literal, XorShift32, Assignment } from "./types";
import { sampleSatSolution, assignmentToObject } from "./engine";

/** Simple assertion helper */
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

/** Helper to create a literal */
function lit(v: number, neg: boolean = false): Literal {
    return { variable: v, negated: neg };
}

/** Unit tests */
function runTests(): void {
    // Test 1: Simple 2‑variable formula with exactly two solutions.
    // (x1 ∨ x2) ∧ (¬x1 ∨ ¬x2)
    const formula1: CNFFormula = [
        [lit(1, false), lit(2, false)],
        [lit(1, true), lit(2, true)]
    ];

    const rng1 = new XorShift32(42);
    const trials = 2000;
    const counts: Record<string, number> = {};

    for (let i = 0; i < trials; i++) {
        const sol = sampleSatSolution(formula1, new XorShift32(i));
        assert(sol !== null, "Formula1 should be satisfiable");
        const key = JSON.stringify(assignmentToObject(sol as Assignment));
        counts[key] = (counts[key] || 0) + 1;
    }

    // There are exactly two solutions: {x1:true,x2:false} and {x1:false,x2:true}
    const solA = JSON.stringify({ x1: true, x2: false });
    const solB = JSON.stringify({ x1: false, x2: true });
    const cntA = counts[solA] ?? 0;
    const cntB = counts[solB] ?? 0;
    const total = cntA + cntB;

    // Both solutions must appear and their frequencies should be roughly equal (±10%)
    assert(total === trials, "All trials must produce a solution");
    const ratio = Math.abs(cntA - cntB) / total;
    assert(ratio < 0.10, `Distribution too skewed: ${cntA} vs ${cntB}`);

    // Test 2: Unsatisfiable formula (x1) ∧ (¬x1)
    const formula2: CNFFormula = [
        [lit(1, false)],
        [lit(1, true)]
    ];
    const unsat = sampleSatSolution(formula2, new XorShift32(7), 20);
    assert(unsat === null, "Unsatisfiable formula must return null");

    // Test 3: Edge case – empty formula (trivially satisfied)
    const formula3: CNFFormula = [];
    const emptySat = sampleSatSolution(formula3, new XorShift32(13));
    assert(emptySat !== null, "Empty formula should be satisfiable");
    // No variables, assignment should be empty
    assert(emptySat!.size === 0, "Empty formula assignment must be empty");

    console.log("All tests passed.");
}

/** Demo driver */
function demo(): void {
    // Random 3‑SAT instance with 4 variables, 5 clauses (guaranteed satisfiable for demo)
    const demoFormula: CNFFormula = [
        [ { variable: 1, negated: false }, { variable: 2, negated: true }, { variable: 3, negated: false } ],
        [ { variable: 1, negated: true }, { variable: 4, negated: false } ],
        [ { variable: 2, negated: false }, { variable: 3, negated: true }, { variable: 4, negated: true } ],
        [ { variable: 1, negated: false }, { variable: 3, negated: false } ],
        [ { variable: 2, negated: true }, { variable: 4, negated: false } ]
    ];

    const rng = new XorShift32(2023);
    const solution = sampleSatSolution(demoFormula, rng, 200);
    if (solution) {
        console.log("Sampled satisfying assignment:");
        console.log(assignmentToObject(solution));
    } else {
        console.log("No solution found (unlikely for this demo).");
    }
}

// Execute tests then demo
runTests();
demo();
