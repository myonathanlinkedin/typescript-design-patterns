export type Matrix = number[][];
export type Vector = number[];

export interface BoundedILPProblem {
    /** Constraint matrix A of size m x n */
    readonly A: Matrix;
    /** Right‑hand side vector b of length m */
    readonly b: Vector;
    /** Lower bounds for variables, length n */
    readonly lower: Vector;
    /** Upper bounds for variables, length n */
    readonly upper: Vector;
}

export interface BoundedILPSolution {
    /** True if a feasible integer assignment exists */
    readonly feasible: boolean;
    /** The feasible assignment (if any). Length equals number of variables */
    readonly x?: Vector;
}
