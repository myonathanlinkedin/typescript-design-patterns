export type Variable = number; // Positive integer identifier

export interface Literal {
    variable: Variable;
    negated: boolean; // true for ¬x, false for x
}

export type Clause = Literal[]; // Disjunction of literals

export type CNFFormula = Clause[]; // Conjunction of clauses

export type Assignment = Map<Variable, boolean>;

export interface PRNG {
    /** Returns a floating point number in the half‑open interval [0, 1). */
    next(): number;
}

// Simple deterministic XorShift32 PRNG (seeded)
export class XorShift32 implements PRNG {
    private state: number;

    constructor(seed: number = 123456789) {
        // Ensure non‑zero seed
        this.state = seed >>> 0 || 1;
    }

    next(): number {
        // Xorshift algorithm
        let x = this.state;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x >>> 0;
        // Convert to [0,1)
        return (this.state >>> 0) / 0x100000000;
    }
}
