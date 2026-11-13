export interface SAMState {
    /** Length of the longest string in the equivalence class represented by this state */
    len: number;
    /** Suffix link (the parent in the suffix link tree), -1 for the root */
    link: number;
    /** Transitions: character -> target state index */
    next: Map<string, number>;
}
