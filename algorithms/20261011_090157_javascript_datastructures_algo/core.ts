export type Comparator<K> = (a: K, b: K) => number;

class AVLNode<K, V> {
    public key: K;
    public value: V;
    public left: AVLNode<K, V> | null = null;
    public right: AVLNode<K, V> | null = null;
    public height: number = 1;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}

/**
 * AVLTree – a self‑balancing binary search tree.
 * Supports generic comparable keys and arbitrary values.
 * All operations are O(log n) in the worst case.
 */
export class AVLTree<K, V> {
    private root: AVLNode<K, V> | null = null;
    private compare: Comparator<K>;

    /**
     * @param compare Optional comparator. If omitted, keys must be number or string.
     */
    constructor(compare?: Comparator<K>) {
        if (compare) {
            this.compare = compare;
        } else {
            this.compare = ((a: any, b: any) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }) as Comparator<K>;
        }
    }

    /** Insert or update a key/value pair. */
    public insert(key: K, value: V): void {
        this.root = this._insert(this.root, key, value);
    }

    /** Delete a key from the tree. Returns true if the key existed. */
    public delete(key: K): boolean {
        const initialSize = this.size();
        this.root = this._delete(this.root, key);
        return this.size() < initialSize;
    }

    /** Find the value associated with a key. Returns undefined if absent. */
    public find(key: K): V | undefined {
        let node = this.root;
        while (node) {
            const cmp = this.compare(key, node.key);
            if (cmp === 0) return node.value;
            node = cmp < 0 ? node.left : node.right;
        }
        return undefined;
    }

    /** Return an array of key/value pairs in ascending key order. */
    public inorder(): Array<{ key: K; value: V }> {
        const result: Array<{ key: K; value: V }> = [];
        this._inorder(this.root, result);
        return result;
    }

    /** Number of nodes stored. */
    public size(): number {
        return this._size(this.root);
    }

    /** Height of the tree (0 for empty). */
    public height(): number {
        return this._nodeHeight(this.root);
    }

    // ---------- Private helpers ----------

    private _nodeHeight(node: AVLNode<K, V> | null): number {
        return node ? node.height : 0;
    }

    private _size(node: AVLNode<K, V> | null): number {
        if (!node) return 0;
        return 1 + this._size(node.left) + this._size(node.right);
    }

    private _inorder(node: AVLNode<K, V> | null, out: Array<{ key: K; value: V }>): void {
        if (!node) return;
        this._inorder(node.left, out);
        out.push({ key: node.key, value: node.value });
        this._inorder(node.right, out);
    }

    private _updateHeight(node: AVLNode<K, V>): void {
        node.height = 1 + Math.max(this._nodeHeight(node.left), this._nodeHeight(node.right));
    }

    private _balanceFactor(node: AVLNode<K, V>): number {
        return this._nodeHeight(node.left) - this._nodeHeight(node.right);
    }

    private _rotateRight(y: AVLNode<K, V>): AVLNode<K, V> {
        const x = y.left!;
        const T2 = x.right;

        // Rotation
        x.right = y;
        y.left = T2;

        // Update heights
        this._updateHeight(y);
        this._updateHeight(x);

        return x;
    }

    private _rotateLeft(x: AVLNode<K, V>): AVLNode<K, V> {
        const y = x.right!;
        const T2 = y.left;

        // Rotation
        y.left = x;
        x.right = T2;

        // Update heights
        this._updateHeight(x);
        this._updateHeight(y);

        return y;
    }

    private _rebalance(node: AVLNode<K, V>): AVLNode<K, V> {
        this._updateHeight(node);
        const balance = this._balanceFactor(node);

        // Left heavy
        if (balance > 1) {
            if (this._balanceFactor(node.left!) < 0) {
                node.left = this._rotateLeft(node.left!);
            }
            return this._rotateRight(node);
        }

        // Right heavy
        if (balance < -1) {
            if (this._balanceFactor(node.right!) > 0) {
                node.right = this._rotateRight(node.right!);
            }
            return this._rotateLeft(node);
        }

        return node;
    }

    private _insert(node: AVLNode<K, V> | null, key: K, value: V): AVLNode<K, V> {
        if (!node) return new AVLNode(key, value);

        const cmp = this.compare(key, node.key);
        if (cmp === 0) {
            node.value = value; // Update existing
        } else if (cmp < 0) {
            node.left = this._insert(node.left, key, value);
        } else {
            node.right = this._insert(node.right, key, value);
        }

        return this._rebalance(node);
    }

    private _minValueNode(node: AVLNode<K, V>): AVLNode<K, V> {
        let current = node;
        while (current.left) current = current.left;
        return current;
    }

    private _delete(node: AVLNode<K, V> | null, key: K): AVLNode<K, V> | null {
        if (!node) return null;

        const cmp = this.compare(key, node.key);
        if (cmp < 0) {
            node.left = this._delete(node.left, key);
        } else if (cmp > 0) {
            node.right = this._delete(node.right, key);
        } else {
            // Node with only one child or none
            if (!node.left) return node.right;
            if (!node.right) return node.left;

            // Node with two children: get inorder successor
            const succ = this._minValueNode(node.right);
            node.key = succ.key;
            node.value = succ.value;
            node.right = this._delete(node.right, succ.key);
        }

        return this._rebalance(node);
    }
}
