export type Variable = number; // 1-based index
export type Literal = number; // positive for true, negative for false (e.g., -3 means ¬x3)
export type Clause = Literal[];
export type CNF = Clause[];

export interface Assignment {
  /** Mapping from variable index to boolean value */
  [variable: number]: boolean;
}

/**
 * Result of a SAT solving run.
 * - `solutions` contains all satisfying assignments found.
 * - `isSatisfiable` is true iff at least one solution exists.
 */
export interface SolveResult {
  solutions: Assignment[];
  isSatisfiable: boolean;
}
