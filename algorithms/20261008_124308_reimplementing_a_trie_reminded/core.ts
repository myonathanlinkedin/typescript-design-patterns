export class TrieNode {
    /** Map from character to child node */
    public readonly children: Map<string, TrieNode> = new Map();
    /** True if a word ends at this node */
    public isEnd: boolean = false;
}

export class Trie {
    private readonly root: TrieNode = new TrieNode();

    /**
     * Insert a word into the trie.
     * @param word non‑empty string (empty string is ignored)
     */
    public insert(word: string): void {
        if (word.length === 0) return;
        let node = this.root;
        for (const ch of word) {
            let child = node.children.get(ch);
            if (!child) {
                child = new TrieNode();
                node.children.set(ch, child);
            }
            node = child;
        }
        node.isEnd = true;
    }

    /**
     * Check whether a word exists in the trie.
     * @param word string to search
     * @returns true iff the exact word was inserted before
     */
    public contains(word: string): boolean {
        if (word.length === 0) return false;
        const node = this.traverse(word);
        return node !== null && node.isEnd;
    }

    /**
     * Delete a word from the trie.
     * @param word string to delete
     * @returns true iff the word existed and was removed
     */
    public delete(word: string): boolean {
        if (word.length === 0) return false;
        return this._delete(this.root, word, 0);
    }

    /**
     * Return up to `limit` words that start with the given prefix,
     * ordered lexicographically.
     * @param prefix prefix string (may be empty)
     * @param limit maximum number of results (undefined = no limit)
     */
    public autocomplete(prefix: string, limit?: number): string[] {
        const results: string[] = [];
        const startNode = prefix.length === 0 ? this.root : this.traverse(prefix);
        if (startNode === null) return results;
        this.collect(startNode, prefix, results, limit);
        return results;
    }

    /** ---------- Private helpers ---------- */

    /** Walk the trie following `key`; return final node or null if missing */
    private traverse(key: string): TrieNode | null {
        let node: TrieNode | undefined = this.root;
        for (const ch of key) {
            node = node?.children.get(ch);
            if (!node) return null;
        }
        return node ?? null;
    }

    /** Depth‑first collection of words from `node` */
    private collect(node: TrieNode, prefix: string, out: string[], limit?: number): void {
        if (limit !== undefined && out.length >= limit) return;
        if (node.isEnd) out.push(prefix);
        const sortedKeys = Array.from(node.children.keys()).sort();
        for (const ch of sortedKeys) {
            if (limit !== undefined && out.length >= limit) break;
            const child = node.children.get(ch)!;
            this.collect(child, prefix + ch, out, limit);
        }
    }

    /** Recursive delete; returns true if parent should delete the child link */
    private _delete(node: TrieNode, word: string, depth: number): boolean {
        if (depth === word.length) {
            if (!node.isEnd) return false; // word not present
            node.isEnd = false;
            return node.children.size === 0;
        }
        const ch = word[depth];
        const child = node.children.get(ch);
        if (!child) return false; // word not present
        const shouldDeleteChild = this._delete(child, word, depth + 1);
        if (shouldDeleteChild) {
            node.children.delete(ch);
            return !node.isEnd && node.children.size === 0;
        }
        return false;
    }
}
