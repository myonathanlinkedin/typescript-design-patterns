import {
  Literal,
  Clause,
  Formula,
  Assignment,
  solveSAT,
  sampleSAT,
  formulaSatisfied,
} from "./core";

function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

// Helper to create literals from variable indices
function pos(v: number): Literal {
  return v;
}
function neg(v: number): Literal {
  return -v;
}

// Unit tests
function testSimpleFormula(): void {
  // (x1 ∨ ¬x2) ∧ (¬x1 ∨ x2)
  const formula: Formula = [
    [pos(1), neg(2)],
    [neg(1), pos(2)],
  ];
  const numVars = 2;
  const sol = solveSAT(formula, numVars);
  assert(sol !== null, "Simple formula should be satisfiable");
  assert(formulaSatisfied(formula, sol!), "Solver returned unsatisfying assignment");
}

function testUnsatFormula(): void {
  // (x1) ∧ (¬x1)
  const formula: Formula = [[pos(1)], [neg(1)]];
  const numVars = 1;
  const sol = solveSAT(formula, numVars);
  assert(sol === null, "Unsatisfiable formula should return null");
}

function testSamplingUniformity(): void {
  // 3 variables, all clauses are empty (always true) => 2^3 solutions
  const formula: Formula = []; // empty CNF is trivially true
  const numVars = 3;
  const counts: Record<string, number> = {};

  const trials = 2000;
  for (let i = 0; i < trials; i++) {
    const sample = sampleSAT(formula, numVars);
    assert(sample !== null, "Sampling should succeed on trivially true formula");
    const key = `${sample![1] ? 1 : 0}${sample![2] ? 1 : 0}${sample![3] ? 1 : 0}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  // Expect each of the 8 assignments to appear roughly equally (within 30% tolerance)
  const expected = trials / 8;
  for (let i = 0; i < 8; i++) {
    const bits = i.toString(2).padStart(3, "0");
    const cnt = counts[bits] ?? 0;
    const ratio = cnt / expected;
    assert(ratio > 0.7 && ratio < 1.3, `Uniformity check failed for ${bits}: ${cnt}`);
  }
}

function testSamplingOnNonTrivialFormula(): void {
  // (x1 ∨ x2) ∧ (¬x1 ∨ x3) ∧ (¬x2 ∨ ¬x3)
  const formula: Formula = [
    [pos(1), pos(2)],
    [neg(1), pos(3)],
    [neg(2), neg(3)],
  ];
  const numVars = 3;
  const sol = solveSAT(formula, numVars);
  assert(sol !== null, "Formula should be satisfiable");
  const sample = sampleSAT(formula, numVars);
  assert(sample !== null, "Sampling should find a solution");
  assert(formulaSatisfied(formula, sample!), "Sampled assignment does not satisfy formula");
}

// Run all tests
function runTests(): void {
  testSimpleFormula();
  testUnsatFormula();
  testSamplingUniformity();
  testSamplingOnNonTrivialFormula();
  console.log("All tests passed.");
}

// Entry point
runTests();
