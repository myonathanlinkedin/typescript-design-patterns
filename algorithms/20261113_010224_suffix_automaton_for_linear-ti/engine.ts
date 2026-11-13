import { SAMState } from "./types";

/**
 * Suffix Automaton (SAM) for a given source string.
 * Provides linear‑time construction and O(m) substring queries.
 */
export class SuffixAutomaton {
    /** All states of the automaton; state 0 is the initial root */
    private states: SAMState[] = [];
    /** Index of the state representing the entire processed prefix */
    private last: number = 0;

    constructor(private readonly source: string) {
        this.initialize();
        for (const ch of source) {
            this.extend(ch);
        }
    }

    /** Public query: does `substr` appear in the original source? */
    public contains(substr: string): boolean {
        if (substr.length === 0) {
            // By definition, the empty string is a substring of any string.
            return true;
        }
        let current = 0; // start at root
        for (const ch of substr) {
            const nextState = this.states[current].next.get(ch);
            if (nextState === undefined) {
                return false;
            }
            current = nextState;
        }
        return true;
    }

    /** --------------------------------------------------------------------
     *  Internal helpers
     * ------------------------------------------------------------------- */

    /** Create the initial root state */
    private initialize(): void {
        this.states.push({
            len: 0,
            link: -1,
            next: new Map<string, number>(),
        });
        this.last = 0;
    }

    /**
     * Extend the automaton with a new character `c`.
     * Classic SAM extension runs in amortized O(1) time.
     */
    private extend(c: string): void {
        const cur = this.states.length;
        this.states.push({
            len: this.states[this.last].len + 1,
            link: 0, // temporary, will be fixed later
            next: new Map<string, number>(),
        });

        let p = this.last;
        // Propagate transition `c` from suffixes of the previous string
        while (p !== -1 && !this.states[p].next.has(c)) {
            this.states[p].next.set(c, cur);
            p = this.states[p].link;
        }

        if (p === -1) {
            // No state with transition `c`; link to root
            this.states[cur].link = 0;
        } else {
            const q = this.states[p].next.get(c)!; // guaranteed existence
            if (this.states[p].len + 1 === this.states[q].len) {
                // Directly attach
                this.states[cur].link = q;
            } else {
                // Clone state `q`
                const clone = this.states.length;
                this.states.push({
                    len: this.states[p].len + 1,
                    link: this.states[q].link,
                    next: new Map(this.states[q].next), // shallow copy of transitions
                });

                // Redirect existing transitions pointing to `q` to the clone
                while (p !== -1 && this.states[p].next.get(c) === q) {
                    this.states[p].next.set(c, clone);
                    p = this.states[p].link;
                }

                this.states[q].link = clone;
                this.states[cur].link = clone;
            }
        }

        this.last = cur;
    }

    /** Expose internal state for advanced testing (read‑only) */
    public getStates(): ReadonlyArray<SAMState> {
        return this.states;
    }
}
