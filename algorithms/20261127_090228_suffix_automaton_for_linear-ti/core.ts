export class SuffixAutomaton {
    private states: State[] = [];
    private last: number = 0;

    constructor(private readonly text: string) {
        this.states.push(this.createState(0, -1)); // root
        for (const ch of text) {
            this.extend(ch);
        }
        this.computeOccurrences();
    }

    /** Returns true if `substr` occurs in the original text. */
    public contains(substr: string): boolean {
        if (substr.length === 0) return true;
        let v = 0;
        for (const ch of substr) {
            const nxt = this.states[v].next.get(ch);
            if (nxt === undefined) return false;
            v = nxt;
        }
        return true;
    }

    /** Returns the number of (possibly overlapping) occurrences of `substr`. */
    public countOccurrences(substr: string): number {
        if (substr.length === 0) return 0;
        let v = 0;
        for (const ch of substr) {
            const nxt = this.states[v].next.get(ch);
            if (nxt === undefined) return 0;
            v = nxt;
        }
        return this.states[v].occ;
    }

    /** Returns the longest common substring between the automaton's text and `other`. */
    public longestCommonSubstring(other: string): string {
        let v = 0;
        let l = 0;
        let best = 0;
        let bestPos = 0;

        for (let i = 0; i < other.length; ++i) {
            const ch = other[i];
            if (this.states[v].next.has(ch)) {
                v = this.states[v].next.get(ch)!;
                ++l;
            } else {
                while (v !== -1 && !this.states[v].next.has(ch)) {
                    v = this.states[v].link;
                }
                if (v === -1) {
                    v = 0;
                    l = 0;
                    continue;
                }
                l = this.states[v].len + 1;
                v = this.states[v].next.get(ch)!;
            }
            if (l > best) {
                best = l;
                bestPos = i;
            }
        }
        return other.substring(bestPos - best + 1, bestPos + 1);
    }

    /** Number of states (useful for complexity checks). */
    public size(): number {
        return this.states.length;
    }

    // ---------- internal helpers ----------
    private createState(len: number, link: number): State {
        return { len, link, next: new Map<string, number>(), occ: 0 };
    }

    private extend(ch: string): void {
        let cur = this.states.length;
        this.states.push(this.createState(this.states[this.last].len + 1, 0));
        this.states[cur].occ = 1;

        let p = this.last;
        while (p !== -1 && !this.states[p].next.has(ch)) {
            this.states[p].next.set(ch, cur);
            p = this.states[p].link;
        }

        if (p === -1) {
            this.states[cur].link = 0;
        } else {
            const q = this.states[p].next.get(ch)!;
            if (this.states[p].len + 1 === this.states[q].len) {
                this.states[cur].link = q;
            } else {
                const clone = this.states.length;
                const clonedState = {
                    len: this.states[p].len + 1,
                    link: this.states[q].link,
                    next: new Map(this.states[q].next),
                    occ: 0,
                };
                this.states.push(clonedState);

                while (p !== -1 && this.states[p].next.get(ch) === q) {
                    this.states[p].next.set(ch, clone);
                    p = this.states[p].link;
                }
                this.states[q].link = clone;
                this.states[cur].link = clone;
            }
        }
        this.last = cur;
    }

    /** Propagates occurrence counts from longer states to their suffix links. */
    private computeOccurrences(): void {
        const maxLen = Math.max(...this.states.map(s => s.len));
        const bucket: number[][] = Array.from({ length: maxLen + 1 }, () => []);
        for (let i = 0; i < this.states.length; ++i) {
            bucket[this.states[i].len].push(i);
        }
        for (let l = maxLen; l >= 0; --l) {
            for (const v of bucket[l]) {
                const link = this.states[v].link;
                if (link !== -1) {
                    this.states[link].occ += this.states[v].occ;
                }
            }
        }
    }
}

interface State {
    len: number;               // length of longest string in this equivalence class
    link: number;              // suffix link
    next: Map<string, number>; // transitions
    occ: number;               // number of end positions (occurrences)
}
