export type Comparator<K> = (a: K, b: K) => number;

class Node<K, V> {
    public key: K;
    public value: V;
    public next: Node<K, V> | null = null;
    public version: number = 0;
    public locked: boolean = false;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}

/**
 * Optimistic Lock Coupling List (sorted singly linked list)
 * Provides lock‑free reads with optimistic validation and
 * lock‑coupled writes. All operations are deterministic and
 * retry a bounded number of times.
 */
export class OptimisticLockCouplingList<K, V> {
    private head: Node<K, V>;
    private compare: Comparator<K>;
    private static readonly MAX_RETRIES = 10;

    constructor(compare: Comparator<K>) {
        // Sentinel head with a key that is less than any real key.
        // For generic K we cannot create -Infinity, so we store null and never compare it.
        this.head = new Node<K, V>(null as any, null as any);
        this.compare = compare;
    }

    /** Acquire lock on a node; returns true if lock obtained. */
    private tryLock(node: Node<K, V>): boolean {
        if (!node.locked) {
            node.locked = true;
            return true;
        }
        return false;
    }

    /** Release lock on a node. */
    private unlock(node: Node<K, V>): void {
        node.locked = false;
    }

    /** Validate that a node's version and lock state have not changed since we recorded them. */
    private validate(node: Node<K, V>, recordedVersion: number): boolean {
        return !node.locked && node.version === recordedVersion;
    }

    /** Internal traversal that records predecessor and current nodes together with their versions. */
    private traverse(key: K): {
        pred: Node<K, V>;
        predVersion: number;
        curr: Node<K, V> | null;
        currVersion: number;
    } {
        let pred = this.head;
        let predVersion = pred.version;
        let curr = pred.next;
        while (curr !== null && this.compare(curr.key, key) < 0) {
            pred = curr;
            predVersion = pred.version;
            curr = curr.next;
        }
        const currVersion = curr ? curr.version : -1;
        return { pred, predVersion, curr, currVersion };
    }

    /** Get value associated with key, or undefined if absent. */
    public get(key: K): V | undefined {
        for (let attempt = 0; attempt < OptimisticLockCouplingList.MAX_RETRIES; ++attempt) {
            const { pred, predVersion, curr, currVersion } = this.traverse(key);
            // No locks taken for read; just validate after traversal.
            if (curr !== null && this.compare(curr.key, key) === 0) {
                // Validate both predecessor and current.
                if (this.validate(pred, predVersion) && this.validate(curr, currVersion)) {
                    return curr.value;
                }
            } else {
                // Key not present; validate predecessor only.
                if (this.validate(pred, predVersion)) {
                    return undefined;
                }
            }
            // Validation failed – retry.
        }
        throw new Error('Optimistic read failed after maximum retries');
    }

    /** Insert or update a key/value pair. */
    public set(key: K, value: V): void {
        for (let attempt = 0; attempt < OptimisticLockCouplingList.MAX_RETRIES; ++attempt) {
            const { pred, predVersion, curr, currVersion } = this.traverse(key);

            // Acquire lock on predecessor first (lock coupling).
            if (!this.tryLock(pred)) {
                continue; // retry
            }

            // If current exists, lock it as well (needed for update or delete).
            if (curr !== null && !this.tryLock(curr)) {
                this.unlock(pred);
                continue; // retry
            }

            // Validate that nodes have not changed since traversal.
            const predOk = this.validate(pred, predVersion);
            const currOk = curr === null ? true : this.validate(curr, currVersion);
            if (!predOk || !currOk) {
                if (curr !== null) this.unlock(curr);
                this.unlock(pred);
                continue; // retry
            }

            // Perform insertion or update.
            if (curr !== null && this.compare(curr.key, key) === 0) {
                // Update existing node.
                curr.value = value;
                curr.version++;
                this.unlock(curr);
                this.unlock(pred);
                return;
            } else {
                // Insert new node between pred and curr.
                const newNode = new Node<K, V>(key, value);
                newNode.next = curr;
                pred.next = newNode;
                pred.version++;
                this.unlock(pred);
                // No need to lock newNode; it's not visible to others yet.
                return;
            }
        }
        throw new Error('Optimistic write (set) failed after maximum retries');
    }

    /** Delete a key from the list; returns true if key was present. */
    public delete(key: K): boolean {
        for (let attempt = 0; attempt < OptimisticLockCouplingList.MAX_RETRIES; ++attempt) {
            const { pred, predVersion, curr, currVersion } = this.traverse(key);
            if (curr === null || this.compare(curr.key, key) !== 0) {
                // Key not present; validate predecessor and exit.
                if (this.validate(pred, predVersion)) {
                    return false;
                } else {
                    continue; // retry
                }
            }

            // Lock predecessor and current.
            if (!this.tryLock(pred)) {
                continue;
            }
            if (!this.tryLock(curr)) {
                this.unlock(pred);
                continue;
            }

            // Validate versions.
            const predOk = this.validate(pred, predVersion);
            const currOk = this.validate(curr, currVersion);
            if (!predOk || !currOk) {
                this.unlock(curr);
                this.unlock(pred);
                continue; // retry
            }

            // Remove curr.
            pred.next = curr.next;
            pred.version++;
            // No need to keep curr after removal.
            this.unlock(pred);
            // curr remains locked but is now unreachable; unlock for completeness.
            this.unlock(curr);
            return true;
        }
        throw new Error('Optimistic write (delete) failed after maximum retries');
    }

    /** For testing: expose the list as an array of keys in order. */
    public toArray(): K[] {
        const result: K[] = [];
        let node = this.head.next;
        while (node !== null) {
            result.push(node.key);
            node = node.next;
        }
        return result;
    }
}
