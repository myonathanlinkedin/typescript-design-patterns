export type Literal = number; // positive for x_i, negative for ¬x_i (1-indexed)
export type Clause = Literal[];
export type Formula = Clause[];

export interface Assignment {
  [varIndex: number]: boolean;
}

/**
 * Evaluates a literal under a given assignment.
 */
export function evalLiteral(lit: Literal, assign: Assignment): boolean {
  const varIdx = Math.abs(lit);
  const val = assign[varIdx] ?? false;
  return lit > 0 ? val : !val;
}

/**
 * Checks whether a clause is satisfied.
 */
export function clauseSatisfied(clause: Clause, assign: Assignment): boolean {
  for (const lit of clause) {
    if (evalLiteral(lit, assign)) return true;
  }
  return false;
}

/**
 * Checks whether the whole formula is satisfied.
 */
export function formulaSatisfied(formula: Formula, assign: Assignment): boolean {
  for (const clause of formula) {
    if (!clauseSatisfied(clause, assign)) return false;
  }
  return true;
}

/**
 * Simple backtracking SAT solver (DPLL without heuristics).
 * Returns a satisfying assignment or null if unsatisfiable.
 */
export function solveSAT(formula: Formula, numVars: number): Assignment | null {
  const assign: Assignment = {};

  function backtrack(v: number): boolean {
    if (v > numVars) {
      return formulaSatisfied(formula, assign);
    }
    // try false
    assign[v] = false;
    if (partialConsistent(v)) {
      if (backtrack(v + 1)) return true;
    }
    // try true
    assign[v] = true;
    if (partialConsistent(v)) {
      if (backtrack(v + 1)) return true;
    }
    delete assign[v];
    return false;
  }

  // Checks that all clauses containing only assigned vars are not falsified yet.
  function partialConsistent(upTo: number): boolean {
    for (const clause of formula) {
      let hasUnassigned = false;
      let clauseSat = false;
      for (const lit of clause) {
        const varIdx = Math.abs(lit);
        if (varIdx > upTo) {
          hasUnassigned = true;
          continue;
        }
        const val = assign[varIdx];
        if (val === undefined) {
          hasUnassigned = true;
          continue;
        }
        if ((lit > 0 && val) || (lit < 0 && !val)) {
          clauseSat = true;
          break;
        }
      }
      if (!clauseSat && !hasUnassigned) return false; // clause falsified
    }
    return true;
  }

  return backtrack(1) ? assign : null;
}

/**
 * Random walk sampler for k-SAT solutions.
 * Starts from a random assignment and performs a bounded number of flips.
 * If a satisfying assignment is reached, returns it; otherwise retries.
 */
export function sampleSAT(
  formula: Formula,
  numVars: number,
  maxSteps: number = 2 * numVars,
  maxRestarts: number = 100
): Assignment | null {
  for (let restart = 0; restart < maxRestarts; restart++) {
    // random initial assignment
    const assign: Assignment = {};
    for (let i = 1; i <= numVars; i++) {
      assign[i] = Math.random() < 0.5;
    }

    for (let step = 0; step < maxSteps; step++) {
      if (formulaSatisfied(formula, assign)) {
        // deep copy to avoid external mutation
        const result: Assignment = {};
        for (let i = 1; i <= numVars; i++) result[i] = assign[i];
        return result;
      }
      // pick a random unsatisfied clause
      const unsatClauses = formula.filter(c => !clauseSatisfied(c, assign));
      if (unsatClauses.length === 0) break; // should not happen
      const clause = unsatClauses[Math.floor(Math.random() * unsatClauses.length)];
      // flip a random variable from that clause
      const lit = clause[Math.floor(Math.random() * clause.length)];
      const varIdx = Math.abs(lit);
      assign[varIdx] = !assign[varIdx];
    }
  }
  return null; // sampling failed
}
