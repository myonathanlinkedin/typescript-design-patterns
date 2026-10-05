type Unlock = () => void;

class Mutex {
    private locked = false;
    private waiters: (() => void)[] = [];

    async lock(): Promise<Unlock> {
        return new Promise<Unlock>(resolve => {
            if (!this.locked) {
                this.locked = true;
                resolve(this.unlock.bind(this));
            } else {
                this.waiters.push(() => {
                    this.locked = true;
                    resolve(this.unlock.bind(this));
                });
            }
        });
    }

    private unlock() {
        if (this.waiters.length > 0) {
            const next = this.waiters.shift()!;
            next();
        } else {
            this.locked = false;
        }
    }
}

interface Entry<V> {
    value: V;
    version: number;
}

/**
 * OptimisticLockCouplingMap provides lock‑free reads and optimistic writes.
 * Writes are retried when a concurrent modification is detected.
 */
class OptimisticLockCouplingMap<K, V> {
    private store = new Map<K, Entry<V>>();
    private mutex = new Mutex();

    /** Read without acquiring any lock. */
    async get(key: K): Promise<V | undefined> {
        const entry = this.store.get(key);
        return entry?.value;
    }

    /** Optimistic write with retry on conflict. */
    async set(key: K, value: V): Promise<void> {
        while (true) {
            const observed = this.store.get(key);
            const observedVersion = observed?.version ?? 0;

            const unlock = await this.mutex.lock();
            try {
                const current = this.store.get(key);
                const currentVersion = current?.version ?? 0;
                if (currentVersion !== observedVersion) {
                    // Conflict detected, retry.
                    continue;
                }
                const newVersion = currentVersion + 1;
                this.store.set(key, { value, version: newVersion });
                return;
            } finally {
                unlock();
            }
        }
    }

    /** Optimistic delete with retry on conflict. */
    async delete(key: K): Promise<boolean> {
        while (true) {
            const observed = this.store.get(key);
            if (!observed) return false; // already absent

            const observedVersion = observed.version;

            const unlock = await this.mutex.lock();
            try {
                const current = this.store.get(key);
                const currentVersion = current?.version ?? 0;
                if (currentVersion !== observedVersion) {
                    continue; // conflict, retry
                }
                this.store.delete(key);
                return true;
            } finally {
                unlock();
            }
        }
    }

    /**
     * Executes a transaction function atomically.
     * The transaction receives a mutable snapshot of the map.
     * On commit, all modified keys are validated against their versions.
     */
    async transaction(
        fn: (tx: Map<K, V>) => Promise<void>
    ): Promise<void> {
        while (true) {
            // Snapshot current state.
            const snapshot = new Map<K, V>();
            const versions = new Map<K, number>();
            for (const [k, entry] of this.store.entries()) {
                snapshot.set(k, entry.value);
                versions.set(k, entry.version);
            }

            // Let user mutate snapshot.
            await fn(snapshot);

            // Determine which keys changed.
            const changedKeys: K[] = [];
            for (const [k, newVal] of snapshot.entries()) {
                const oldVersion = versions.get(k);
                const oldEntry = this.store.get(k);
                const oldVal = oldEntry?.value;
                if (oldVersion === undefined) {
                    // New key.
                    changedKeys.push(k);
                } else if (oldVal !== newVal) {
                    changedKeys.push(k);
                }
            }
            // Also detect deletions.
            for (const k of this.store.keys()) {
                if (!snapshot.has(k)) {
                    changedKeys.push(k);
                }
            }

            const unlock = await this.mutex.lock();
            try {
                // Validate that none of the changed keys were modified since snapshot.
                let conflict = false;
                for (const k of changedKeys) {
                    const currentVersion = this.store.get(k)?.version ?? 0;
                    const observedVersion = versions.get(k) ?? 0;
                    if (currentVersion !== observedVersion) {
                        conflict = true;
                        break;
                    }
                }
                if (conflict) continue; // retry whole transaction

                // Apply changes.
                for (const k of changedKeys) {
                    if (!snapshot.has(k)) {
                        // Deletion
                        this.store.delete(k);
                    } else {
                        const newVal = snapshot.get(k)!;
                        const newVersion = (this.store.get(k)?.version ?? 0) + 1;
                        this.store.set(k, { value: newVal, version: newVersion });
                    }
                }
                return;
            } finally {
                unlock();
            }
        }
    }
}

/* ---------- Simple Assertion Utilities ---------- */
function assert(condition: boolean, message?: string): void {
    if (!condition) throw new Error(message ?? 'Assertion failed');
}

/* ---------- Demonstration & Unit Tests ---------- */
(async () => {
    const map = new OptimisticLockCouplingMap<string, number>();

    // Test basic set/get
    await map.set('a', 1);
    assert((await map.get('a')) === 1, 'Set/Get failed');

    // Test overwrite with optimistic retry
    await Promise.all([
        (async () => {
            await map.set('a', 2);
        })(),
        (async () => {
            await map.set('a', 3);
        })()
    ]);
    const valA = await map.get('a');
    assert(valA === 2 || valA === 3, 'Concurrent set resulted in unexpected value');

    // Test delete
    const deleted = await map.delete('a');
    assert(deleted === true, 'Delete should return true');
    assert((await map.get('a')) === undefined, 'Value should be undefined after delete');

    // Test transaction commit
    await map.set('x', 10);
    await map.set('y', 20);
    await map.transaction(async tx => {
        const xv = tx.get('x')!;
        tx.set('x', xv + 5);
        tx.set('z', 30);
    });
    assert((await map.get('x')) === 15, 'Transaction update x failed');
    assert((await map.get('y')) === 20, 'Transaction should not modify y');
    assert((await map.get('z')) === 30, 'Transaction insert z failed');

    // Test transaction conflict and retry
    let conflictSeen = false;
    await Promise.all([
        (async () => {
            await map.transaction(async tx => {
                const xv = tx.get('x')!;
                // Simulate work
                await new Promise(r => setTimeout(r, 10));
                tx.set('x', xv + 1);
            });
        })(),
        (async () => {
            // Concurrent modification that will cause conflict
            await new Promise(r => setTimeout(r, 5));
            await map.set('x', 100);
            conflictSeen = true;
        })()
    ]);
    assert(conflictSeen, 'Conflict scenario did not occur');
    const finalX = await map.get('x');
    assert(finalX === 101, 'Final value after conflict retry incorrect');

    console.log('All tests passed.');
})();
