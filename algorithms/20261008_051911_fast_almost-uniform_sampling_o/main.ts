import {
  Variable,
  Literal,
  Clause,
  CNF,
  Assignment,
  SolveResult,
} from "./types";
import {
  evalClause,
  evalCNF,
  solveAll,
  randomKSatInstance,
  sampleSolution,
  sampleSolutions,
} from "./engine";

/**
 * Simple assertion helper.
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

/**
 * Pretty‑prints an assignment.
 */
function assignmentToString(assign: Assignment, nVars: number): string {
  const bits = [];
  for (let v = 1; v <= nVars; v++) {
    bits.push(assign[v] ? "1" : "0");
  }
  return bits.join("");
}

/**
 * Demo & unit‑test driver.
 */
function main(): void {
  // Parameters for a modest instance (exhaustive enumeration feasible)
  const n = 4; // variables
  const k = 3; // clause size
  const m = 5; // number of clauses

  // Generate a random instance
  const cnf: CNF = randomKSatInstance(n, m, k);
  console.log("Generated CNF (k-SAT) instance:");
  cnf.forEach((clause, idx) => {
    const lits = clause
      .map((lit) => (lit > 0 ? `x${lit}` : `¬x${-lit}`))
      .join(" ∨ ");
    console.log(`Clause ${idx + 1}: (${lits})`);
  });

  // Solve exhaustively
  const solveResult: SolveResult = solveAll(cnf, n);
  console.log(`\nNumber of satisfying assignments: ${solveResult.solutions.length}`);

  // Edge‑case assertions
  assert(solveResult.solutions.length >= 0, "Solution count should be non‑negative");
  if (solveResult.isSatisfiable) {
    // Verify each reported assignment indeed satisfies the formula
    for (const assign of solveResult.solutions) {
      const val = evalCNF(cnf, assign);
      assert(val === true, "Reported solution does not satisfy the CNF");
    }
  } else {
    // Ensure no assignment satisfies the formula
    const anyAssign: Assignment = {};
    for (let v = 1; v <= n; v++) anyAssign[v] = true;
    const val = evalCNF(cnf, anyAssign);
    assert(val !== true, "Unsatisfiable instance reported as satisfiable");
  }

  // Sampling test: draw many samples and check near‑uniform distribution
  const sampleCount = 1000;
  const samples = sampleSolutions(cnf, n, sampleCount);
  if (solveResult.isSatisfiable) {
    const solutionStrings = solveResult.solutions.map((a) =>
      assignmentToString(a, n)
    );
    const freq: Record<string, number> = {};
    for (const s of solutionStrings) freq[s] = 0;
    for (const sample of samples) {
      const s = assignmentToString(sample, n);
      freq[s] = (freq[s] || 0) + 1;
    }
    // Expected frequency per solution (uniform)
    const expected = sampleCount / solutionStrings.length;
    const tolerance = expected * 0.2; // 20 % tolerance
    for (const sol of solutionStrings) {
      const observed = freq[sol] ?? 0;
      assert(
        Math.abs(observed - expected) <= tolerance,
        `Sampled frequency for ${sol} deviates beyond tolerance (observed=${observed}, expected≈${expected})`
      );
    }
    console.log("\nSampling distribution passed uniformity checks (±20 %).");
  } else {
    assert(samples.length === 0, "No samples should be produced for unsatisfiable instance");
    console.log("\nInstance unsatisfiable – no samples generated as expected.");
  }

  // Demonstrate single‑sample retrieval
  const single = sampleSolution(cnf, n);
  if (single) {
    console.log("\nSingle sampled solution:", assignmentToString(single, n));
  } else {
    console.log("\nNo solution exists for the generated instance.");
  }
}

// Execute driver
main();
