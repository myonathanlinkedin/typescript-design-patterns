export type Comparator<K> = (a: K, b: K) => number;

class AVLNode<K, V> {
    public key: K;
    public value: V;
    public height: number;
    public left: AVLNode<K, V> | null = null;
    public right: AVLNode<K, V> | null = null;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
        this.height = 1;
    }
}

/**
 * AVLTree – a self‑balancing binary search tree.
 * Guarantees O(log n) height for insert, delete and search.
 */
export class AVLTree<K, V> {
    private root: AVLNode<K, V> | null = null;
    private compare: Comparator<K>;

    constructor(compareFn: Comparator<K>) {
        this.compare = compareFn;
    }

    /** Public API ---------------------------------------------------------- */

    /** Insert or replace a key/value pair. */
    public insert(key: K, value: V): void {
        this.root = this._insert(this.root, key, value);
    }

    /** Delete a key. Returns true if the key existed. */
    public delete(key: K): boolean {
        const [newRoot, deleted] = this._delete(this.root, key);
        this.root = newRoot;
        return deleted;
    }

    /** Find a value by key. Returns undefined if not present. */
    public find(key: K): V | undefined {
        let node = this.root;
        while (node !== null) {
            const cmp = this.compare(key, node.key);
            if (cmp === 0) return node.value;
            node = cmp < 0 ? node.left : node.right;
        }
        return undefined;
    }

    /** Return an inorder array of [key, value] tuples (sorted by key). */
    public inorder(): Array<[K, V]> {
        const result: Array<[K, V]> = [];
        this._inorder(this.root, result);
        return result;
    }

    /** Return the current height of the tree (0 for empty). */
    public height(): number {
        return this._nodeHeight(this.root);
    }

    /** Private helpers ----------------------------------------------------- */

    private _nodeHeight(node: AVLNode<K, V> | null): number {
        return node ? node.height : 0;
    }

    private _updateHeight(node: AVLNode<K, V>): void {
        node.height = 1 + Math.max(this._nodeHeight(node.left), this._nodeHeight(node.right));
    }

    private _balanceFactor(node: AVLNode<K, V>): number {
        return this._nodeHeight(node.left) - this._nodeHeight(node.right);
    }

    private _rightRotate(y: AVLNode<K, V>): AVLNode<K, V> {
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

    private _leftRotate(x: AVLNode<K, V>): AVLNode<K, V> {
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
                // LR case
                node.left = this._leftRotate(node.left!);
            }
            // LL case
            return this._rightRotate(node);
        }

        // Right heavy
        if (balance < -1) {
            if (this._balanceFactor(node.right!) > 0) {
                // RL case
                node.right = this._rightRotate(node.right!);
            }
            // RR case
            return this._leftRotate(node);
        }

        // Already balanced
        return node;
    }

    private _insert(node: AVLNode<K, V> | null, key: K, value: V): AVLNode<K, V> {
        if (node === null) {
            return new AVLNode(key, value);
        }

        const cmp = this.compare(key, node.key);
        if (cmp < 0) {
            node.left = this._insert(node.left, key, value);
        } else if (cmp > 0) {
            node.right = this._insert(node.right, key, value);
        } else {
            // Duplicate key – replace value
            node.value = value;
            return node;
        }

        return this._rebalance(node);
    }

    private _minValueNode(node: AVLNode<K, V>): AVLNode<K, V> {
        let current = node;
        while (current.left !== null) {
            current = current.left;
        }
        return current;
    }

    private _delete(node: AVLNode<K, V> | null, key: K): [AVLNode<K, V> | null, boolean] {
        if (node === null) {
            return [null, false];
        }

        let deleted = false;
        const cmp = this.compare(key, node.key);
        if (cmp < 0) {
            const [newLeft, didDelete] = this._delete(node.left, key);
            node.left = newLeft;
            deleted = didDelete;
        } else if (cmp > 0) {
            const [newRight, didDelete] = this._delete(node.right, key);
            node.right = newRight;
            deleted = didDelete;
        } else {
            // Node to delete found
            deleted = true;
            if (node.left === null) {
                return [node.right, true];
            } else if (node.right === null) {
                return [node.left, true];
            } else {
                // Two children: replace with inorder successor
                const succ = this._minValueNode(node.right);
                node.key = succ.key;
                node.value = succ.value;
                const [newRight, _] = this._delete(node.right, succ.key);
                node.right = newRight;
            }
        }

        if (!deleted) {
            // No structural change, just propagate
            return [node, false];
        }

        // Rebalance after deletion
        const rebalanceNode = this._rebalance(node);
        return [rebalanceNode, true];
    }

    private _inorder(node: AVLNode<K, V> | null, out: Array<[K, V]>): void {
        if (node === null) return;
        this._inorder(node.left, out);
        out.push([node.key, node.value]);
        this._inorder(node.right, out);
    }
}
