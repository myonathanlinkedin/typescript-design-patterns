import { HuffmanNode } from "./types";

/* ---------- Min‑Heap (priority queue) ---------- */
class MinHeap<T> {
    private data: T[] = [];
    constructor(private compare: (a: T, b: T) => number) {}

    push(item: T): void {
        this.data.push(item);
        this.bubbleUp(this.data.length - 1);
    }

    pop(): T | undefined {
        if (this.data.length === 0) return undefined;
        const top = this.data[0];
        const end = this.data.pop()!;
        if (this.data.length > 0) {
            this.data[0] = end;
            this.sinkDown(0);
        }
        return top;
    }

    size(): number {
        return this.data.length;
    }

    private bubbleUp(idx: number): void {
        const element = this.data[idx];
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2);
            const parent = this.data[parentIdx];
            if (this.compare(element, parent) >= 0) break;
            this.data[parentIdx] = element;
            this.data[idx] = parent;
            idx = parentIdx;
        }
    }

    private sinkDown(idx: number): void {
        const length = this.data.length;
        const element = this.data[idx];
        while (true) {
            let leftIdx = 2 * idx + 1;
            let rightIdx = 2 * idx + 2;
            let swap: number | null = null;

            if (leftIdx < length) {
                const left = this.data[leftIdx];
                if (this.compare(left, element) < 0) swap = leftIdx;
            }
            if (rightIdx < length) {
                const right = this.data[rightIdx];
                if (
                    (swap === null && this.compare(right, element) < 0) ||
                    (swap !== null && this.compare(right, this.data[swap]) < 0)
                ) {
                    swap = rightIdx;
                }
            }
            if (swap === null) break;
            this.data[idx] = this.data[swap];
            this.data[swap] = element;
            idx = swap;
        }
    }
}

/* ---------- Core Huffman functions ---------- */

/** Build a frequency map from the input string */
function buildFrequencyMap(input: string): Map<string, number> {
    const freq = new Map<string, number>();
    for (const ch of input) {
        freq.set(ch, (freq.get(ch) ?? 0) + 1);
    }
    return freq;
}

/** Construct the Huffman tree from a frequency map */
function buildHuffmanTree(freqMap: Map<string, number>): HuffmanNode {
    const heap = new MinHeap<HuffmanNode>((a, b) => a.freq - b.freq);
    for (const [ch, f] of freqMap.entries()) {
        heap.push({ char: ch, freq: f });
    }

    // Edge case: empty input → return an empty node
    if (heap.size() === 0) {
        return { freq: 0 };
    }

    while (heap.size() > 1) {
        const left = heap.pop()!;
        const right = heap.pop()!;
        const merged: HuffmanNode = {
            freq: left.freq + right.freq,
            left,
            right,
        };
        heap.push(merged);
    }
    return heap.pop()!;
}

/** Generate prefix codes for each character by traversing the tree */
function generateCodes(root: HuffmanNode): Map<string, string> {
    const codes = new Map<string, string>();

    function traverse(node: HuffmanNode, prefix: string): void {
        if (node.char !== undefined) {
            // Single‑character case: assign "0" if prefix empty
            codes.set(node.char, prefix.length > 0 ? prefix : "0");
            return;
        }
        if (node.left) traverse(node.left, prefix + "0");
        if (node.right) traverse(node.right, prefix + "1");
    }

    traverse(root, "");
    return codes;
}

/** Encode a string into a bitstring using the provided codes */
function encode(input: string, codes: Map<string, string>): string {
    let bits = "";
    for (const ch of input) {
        const code = codes.get(ch);
        if (code === undefined) {
            throw new Error(`Character "${ch}" missing from Huffman codes`);
        }
        bits += code;
    }
    return bits;
}

/** Decode a bitstring back to the original text using the Huffman tree */
function decode(bitstring: string, root: HuffmanNode): string {
    if (bitstring.length === 0) return "";
    let result = "";
    let node: HuffmanNode = root;

    for (const bit of bitstring) {
        if (bit === "0") {
            if (!node.left) throw new Error("Invalid bitstring: reached missing left child");
            node = node.left;
        } else if (bit === "1") {
            if (!node.right) throw new Error("Invalid bitstring: reached missing right child");
            node = node.right;
        } else {
            throw new Error(`Invalid bit character "${bit}"`);
        }

        if (node.char !== undefined) {
            result += node.char;
            node = root; // restart for next symbol
        }
    }
    return result;
}

/** Public API: compress a string into a bitstring and its Huffman tree */
export function compress(input: string): { encoded: string; tree: HuffmanNode } {
    const freqMap = buildFrequencyMap(input);
    const tree = buildHuffmanTree(freqMap);
    const codes = generateCodes(tree);
    const encoded = encode(input, codes);
    return { encoded, tree };
}

/** Public API: decompress a bitstring using the supplied Huffman tree */
export function decompress(encoded: string, tree: HuffmanNode): string {
    // Empty input yields empty output regardless of tree
    if (encoded.length === 0) return "";
    return decode(encoded, tree);
}

/* Export helpers for exhaustive testing (optional) */
export {
    buildFrequencyMap,
    buildHuffmanTree,
    generateCodes,
    encode,
    decode,
};
