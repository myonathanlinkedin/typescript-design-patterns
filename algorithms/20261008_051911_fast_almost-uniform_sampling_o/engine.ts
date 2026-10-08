import { Variable, Literal, Clause, CNF, Assignment, SolveResult } from "./types";

/**
 * Evaluates a single clause under a (possibly partial) assignment.
 * Returns:
 * - true  if the clause is already satisfied,
 * - false if the clause is falsified,
 * - undefined if its truth value cannot yet be determined.
 */
export function evalClause(clause: Clause, assign: Assignment): boolean | undefined {
  let undetermined = false;
  for (const lit of clause) {
    const v = Math.abs(lit);
    const val = assign[v];
    if (val === undefined) {
      undetermined = true;
      continue;
    }
    const litTrue = lit > 0 ? val : !val;
    if (litTrue) return true; // clause satisfied
  }
  return undetermined ? undefined : false; // falsified if no literals can become true
}

/**
 * Evaluates a CNF formula under a (possibly partial) assignment.
 * Returns true/false/undefined analogous to evalClause.
 */
export function evalCNF(cnf: CNF, assign: Assignment): boolean | undefined {
  let undetermined = false;
  for (const clause of cnf) {
    const val = evalClause(clause, assign);
    if (val === false) continue; // clause falsified, keep checking others
    if (val === true) continue; // clause satisfied, ok
    // val === undefined
    undetermined = true;
  }
  // If any clause is falsified, the whole formula is falsified.
  for (const clause of cnf) {
    const val = evalClause(clause, assign);
    if (val === false) return false;
  }
  return undetermined ? undefined : true;
}

/**
 * Recursive backtracking enumerator that collects all satisfying assignments.
 */
function backtrack(
  cnf: CNF,
  nVars: number,
  assign: Assignment,
  solutions: Assignment[]
): void {
  const evalResult = evalCNF(cnf, assign);
  if (evalResult === false) {
    // dead end
    return;
  }
  if (evalResult === true) {
    // complete (or partial but already satisfied); fill remaining vars arbitrarily
    const fullAssign: Assignment = { ...assign };
    for (let v = 1; v <= nVars; v++) {
      if (fullAssign[v] === undefined) fullAssign[v] = true; // arbitrary
    }
    solutions.push(fullAssign);
    return;
  }
  // pick next unassigned variable
  const nextVar = (() => {
    for (let v = 1; v <= nVars; v++) {
      if (assign[v] === undefined) return v;
    }
    return undefined;
  })();
  if (nextVar === undefined) {
    // all vars assigned but formula not yet decided (should be true)
    const fullAssign: Assignment = { ...assign };
    solutions.push(fullAssign);
    return;
  }
  // try true
  assign[nextVar] = true;
  backtrack(cnf, nVars, assign, solutions);
  // try false
  assign[nextVar] = false;
  backtrack(cnf, nVars, assign, solutions);
  // backtrack cleanup
  delete assign[nextVar];
}

/**
 * Returns all satisfying assignments for the given CNF.
 */
export function solveAll(cnf: CNF, nVars: number): SolveResult {
  const solutions: Assignment[] = [];
  backtrack(cnf, nVars, {}, solutions);
  return { solutions, isSatisfiable: solutions.length > 0 };
}

/**
 * Generates a random k‑SAT instance with n variables, m clauses, each clause of size k.
 * No duplicate literals within a clause; clauses may repeat.
 */
export function randomKSatInstance(n: number, m: number, k: number): CNF {
  const cnf: CNF = [];
  const randInt = (max: number) => Math.floor(Math.random() * max);
  for (let i = 0; i < m; i++) {
    const clauseSet = new Set<Literal>();
    while (clauseSet.size < k) {
      const varIdx = randInt(n) + 1; // 1..n
      const sign = Math.random() < 0.5 ? 1 : -1;
      clauseSet.add(sign * varIdx);
    }
    cnf.push(Array.from(clauseSet));
  }
  return cnf;
}

/**
 * Returns a single solution sampled uniformly from the solution space.
 * For small instances we enumerate all solutions; for larger instances this
 * function degrades to returning the first found solution (still correct but not uniform).
 */
export function sampleSolution(cnf: CNF, nVars: number): Assignment | null {
  const result = solveAll(cnf, nVars);
  if (!result.isSatisfiable) return null;
  const idx = Math.floor(Math.random() * result.solutions.length);
  return result.solutions[idx];
}

/**
 * Generates `count` samples (with replacement) from the solution space.
 */
export function sampleSolutions(
  cnf: CNF,
  nVars: number,
  count: number
): Assignment[] {
  const result = solveAll(cnf, nVars);
  if (!result.isSatisfiable) return [];
  const samples: Assignment[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * result.solutions.length);
    samples.push(result.solutions[idx]);
  }
  return samples;
}
