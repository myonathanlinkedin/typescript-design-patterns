export interface HuffmanNode {
    /** Optional character for leaf nodes */
    char?: string;
    /** Frequency count */
    freq: number;
    /** Left child (represents bit 0) */
    left?: HuffmanNode;
    /** Right child (represents bit 1) */
    right?: HuffmanNode;
}
