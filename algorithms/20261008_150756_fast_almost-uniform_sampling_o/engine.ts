import { Variable, Literal, Clause, CNFFormula, Assignment, PRNG } from "./types";

/**
 * Evaluates a single literal under a (partial) assignment.
 * Returns:
 *   true  – literal is satisfied,
 *   false – literal is falsified,
 *   null  – literal's variable is unassigned.
 */
function evalLiteral(lit: Literal, assign: Assignment): boolean | null {
    const val = assign.get(lit.variable);
    if (val === undefined) return null;
    return lit.negated ? !val : val;
}

/**
 * Evaluates a clause under a (partial) assignment.
 * Returns:
 *   true  – clause is satisfied,
 *   false – clause is falsified,
 *   null  – clause is undetermined (some literals unassigned, none satisfied yet).
 */
function evalClause(clause: Clause, assign: Assignment): boolean | null {
    let unknown = false;
    for (const lit of clause) {
        const ev = evalLiteral(lit, assign);
        if (ev === true) return true;
        if (ev === null) unknown = true;
    }
    return unknown ? null : false;
}

/**
 * Checks whether the whole formula is satisfied, falsified, or still undetermined.
 */
function evalFormula(formula: CNFFormula, assign: Assignment): boolean | null {
    let unknown = false;
    for (const clause of formula) {
        const ev = evalClause(clause, assign);
        if (ev === false) return false; // a clause falsified → formula falsified
        if (ev === null) unknown = true;
    }
    return unknown ? null : true;
}

/**
 * Returns a list of unit literals (clauses of length 1) that are not yet satisfied.
 */
function findUnitLiterals(formula: CNFFormula, assign: Assignment): Literal[] {
    const units: Literal[] = [];
    for (const clause of formula) {
        const ev = evalClause(clause, assign);
        if (ev !== null) continue; // already satisfied or falsified
        // Count unassigned literals
        const unassigned: Literal[] = [];
        for (const lit of clause) {
            const val = assign.get(lit.variable);
            if (val === undefined) unassigned.push(lit);
        }
        if (unassigned.length === 1) {
            units.push(unassigned[0]);
        }
    }
    return units;
}

/**
 * Returns a list of pure literals (appear only with one polarity) that are not yet assigned.
 */
function findPureLiterals(formula: CNFFormula, assign: Assignment): Literal[] {
    const polarity = new Map<Variable, Set<boolean>>();
    for (const clause of formula) {
        const ev = evalClause(clause, assign);
        if (ev !== null) continue; // clause already satisfied/falsified
        for (const lit of clause) {
            if (assign.has(lit.variable)) continue;
            let set = polarity.get(lit.variable);
            if (!set) {
                set = new Set<boolean>();
                polarity.set(lit.variable, set);
            }
            set.add(lit.negated);
        }
    }
    const pure: Literal[] = [];
    for (const [v, signs] of polarity.entries()) {
        if (signs.size === 1) {
            pure.push({ variable: v, negated: signs.has(true) });
        }
    }
    return pure;
}

/**
 * Picks a random unassigned variable using the supplied PRNG.
 */
function pickRandomVariable(formula: CNFFormula, assign: Assignment, rng: PRNG): Variable {
    const vars = new Set<Variable>();
    for (const clause of formula) {
        for (const lit of clause) {
            if (!assign.has(lit.variable)) vars.add(lit.variable);
        }
    }
    const arr = Array.from(vars);
    if (arr.length === 0) throw new Error("No unassigned variables left to pick.");
    const idx = Math.floor(rng.next() * arr.length);
    return arr[idx];
}

/**
 * Recursive DPLL SAT solver with random variable ordering.
 * Returns a complete satisfying assignment or null if unsatisfiable.
 */
export function dpllSolve(formula: CNFFormula, rng: PRNG, assign: Assignment = new Map()): Assignment | null {
    // Simplify via unit propagation
    while (true) {
        const units = findUnitLiterals(formula, assign);
        if (units.length === 0) break;
        for (const lit of units) {
            assign.set(lit.variable, !lit.negated);
        }
    }

    // Pure literal elimination
    const pureLits = findPureLiterals(formula, assign);
    for (const lit of pureLits) {
        assign.set(lit.variable, !lit.negated);
    }

    const formulaStatus = evalFormula(formula, assign);
    if (formulaStatus === false) return null; // conflict
    if (formulaStatus === true) return assign; // satisfied

    // Choose a variable randomly and branch
    const varChoice = pickRandomVariable(formula, assign, rng);
    // Branch true
    const assignTrue = new Map(assign);
    assignTrue.set(varChoice, true);
    const resultTrue = dpllSolve(formula, rng, assignTrue);
    if (resultTrue !== null) return resultTrue;

    // Branch false
    const assignFalse = new Map(assign);
    assignFalse.set(varChoice, false);
    return dpllSolve(formula, rng, assignFalse);
}

/**
 * Almost‑uniform sampler for SAT solutions.
 * It runs the randomized DPLL solver `attempts` times (default 100) and returns
 * the first satisfying assignment found. If none is found, returns null.
 *
 * The randomness of variable ordering makes each solution roughly equally likely,
 * and the probability of missing a solution decays exponentially with `attempts`.
 */
export function sampleSatSolution(
    formula: CNFFormula,
    rng: PRNG,
    attempts: number = 100
): Assignment | null {
    for (let i = 0; i < attempts; i++) {
        const sol = dpllSolve(formula, rng);
        if (sol !== null) return sol;
    }
    return null; // likely unsatisfiable or extremely low solution density
}

/**
 * Utility to convert an Assignment to a plain object for easier testing/printing.
 */
export function assignmentToObject(assign: Assignment): Record<string, boolean> {
    const obj: Record<string, boolean> = {};
    for (const [v, b] of assign.entries()) {
        obj[`x${v}`] = b;
    }
    return obj;
}
