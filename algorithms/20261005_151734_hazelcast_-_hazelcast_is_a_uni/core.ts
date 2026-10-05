export type EventType = 'put' | 'delete';

export interface MapEvent<K, V> {
    type: EventType;
    key: K;
    oldValue?: V;
    newValue?: V;
}

export class EventBus<T> {
    private listeners: Set<(event: T) => void> = new Set();

    subscribe(listener: (event: T) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    publish(event: T): void {
        for (const listener of this.listeners) {
            try {
                listener(event);
            } catch {
                // swallow listener errors to avoid breaking the bus
            }
        }
    }
}

/**
 * Simple async mutex for protecting critical sections.
 */
export class Mutex {
    private _locked = false;
    private _waiters: Array<() => void> = [];

    async lock(): Promise<() => void> {
        if (!this._locked) {
            this._locked = true;
            return this._unlock.bind(this);
        }
        return new Promise(resolve => {
            this._waiters.push(() => {
                this._locked = true;
                resolve(this._unlock.bind(this));
            });
        });
    }

    private _unlock() {
        if (this._waiters.length > 0) {
            const next = this._waiters.shift()!;
            next();
        } else {
            this._locked = false;
        }
    }
}

/**
 * In‑memory distributed map with event notifications.
 */
export class DistributedMap<K, V> {
    private readonly store = new Map<K, V>();
    private readonly bus = new EventBus<MapEvent<K, V>>();
    private readonly mutex = new Mutex();

    async set(key: K, value: V): Promise<void> {
        const unlock = await this.mutex.lock();
        try {
            const oldValue = this.store.get(key);
            this.store.set(key, value);
            this.bus.publish({
                type: 'put',
                key,
                oldValue,
                newValue: value,
            });
        } finally {
            unlock();
        }
    }

    async get(key: K): Promise<V | undefined> {
        const unlock = await this.mutex.lock();
        try {
            return this.store.get(key);
        } finally {
            unlock();
        }
    }

    async delete(key: K): Promise<boolean> {
        const unlock = await this.mutex.lock();
        try {
            if (!this.store.has(key)) return false;
            const oldValue = this.store.get(key);
            const result = this.store.delete(key);
            if (result) {
                this.bus.publish({
                    type: 'delete',
                    key,
                    oldValue,
                });
            }
            return result;
        } finally {
            unlock();
        }
    }

    async entries(): Promise<Array<[K, V]>> {
        const unlock = await this.mutex.lock();
        try {
            return Array.from(this.store.entries());
        } finally {
            unlock();
        }
    }

    /**
     * Subscribe to map events.
     * Returns an unsubscribe function.
     */
    on(listener: (event: MapEvent<K, V>) => void): () => void {
        return this.bus.subscribe(listener);
    }
}

/**
 * Processor function type.
 */
export type Processor<I, O> = (input: I) => O | Promise<O>;

/**
 * StreamProcessor connects a source DistributedMap to a target DistributedMap
 * using a user‑provided processing function.
 */
export class StreamProcessor<I, O> {
    private readonly unsubscribe: () => void;

    constructor(
        private readonly source: DistributedMap<any, I>,
        private readonly target: DistributedMap<any, O>,
        private readonly processor: Processor<I, O>,
        private readonly keyMapper: (srcKey: any, srcValue: I) => any = (k) => k
    ) {
        this.unsubscribe = this.source.on(async (event) => {
            if (event.type === 'put' && event.newValue !== undefined) {
                const outKey = this.keyMapper(event.key, event.newValue);
                const outValue = await this.processor(event.newValue);
                await this.target.set(outKey, outValue);
            } else if (event.type === 'delete' && event.key !== undefined) {
                const outKey = this.keyMapper(event.key, event.oldValue as I);
                await this.target.delete(outKey);
            }
        });
    }

    /**
     * Gracefully stop processing and detach listeners.
     */
    stop(): void {
        this.unsubscribe();
    }
}
