export type Event<T = any> = {
    type: string;
    payload: T;
    timestamp: number;
    meta?: Record<string, any>;
};

export type EventHandler<T = any> = (event: Event<T>) => Promise<void> | void;

export class EventBus {
    private handlers: Map<string, Set<EventHandler>> = new Map();

    on<T = any>(type: string, handler: EventHandler<T>): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)!.add(handler as EventHandler);
    }

    off<T = any>(type: string, handler: EventHandler<T>): void {
        this.handlers.get(type)?.delete(handler as EventHandler);
    }

    async emit<T = any>(event: Event<T>): Promise<void> {
        const handlers = this.handlers.get(event.type);
        if (!handlers) return;
        const promises: Promise<void>[] = [];
        for (const h of handlers) {
            try {
                const result = h(event);
                if (result instanceof Promise) {
                    promises.push(result);
                }
            } catch {
                // swallow synchronous errors; they will be handled in async flow
            }
        }
        if (promises.length) {
            await Promise.all(promises);
        }
    }
}

/**
 * Thin client for Faststream-like event-driven services.
 * Supports fire-and-forget publishing and request/response patterns.
 */
export class FaststreamClient {
    private bus: EventBus;
    private pending: Map<string, { resolve: (v: any) => void; reject: (e: any) => void; timer: NodeJS.Timeout }> = new Map();

    constructor(bus: EventBus) {
        this.bus = bus;
        // Global listener for response events
        this.bus.on<any>('__faststream_response__', (e) => this.handleResponse(e));
    }

    async publish<T = any>(type: string, payload: T): Promise<void> {
        const ev: Event<T> = { type, payload, timestamp: Date.now() };
        await this.bus.emit(ev);
    }

    subscribe<T = any>(type: string, handler: EventHandler<T>): void {
        this.bus.on<T>(type, handler);
    }

    async request<T = any, R = any>(type: string, payload: T, timeoutMs = 5000): Promise<R> {
        const requestId = FaststreamClient.generateId();
        const responseType = '__faststream_response__';
        const ev: Event<T> = {
            type,
            payload,
            timestamp: Date.now(),
            meta: { requestId, responseType },
        };
        const promise = new Promise<R>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(requestId);
                reject(new Error(`Faststream request timeout for ${type}`));
            }, timeoutMs);
            this.pending.set(requestId, { resolve, reject, timer });
        });
        await this.bus.emit(ev);
        return promise;
    }

    private async handleResponse(event: Event<any>): Promise<void> {
        const { requestId, result, error } = event.payload;
        const pending = this.pending.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.pending.delete(requestId);
        if (error) {
            pending.reject(new Error(error));
        } else {
            pending.resolve(result);
        }
    }

    static generateId(): string {
        // Simple fast unique id (not cryptographically secure)
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
