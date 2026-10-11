/**
 * Wingfoil – Ultra Low Latency Graph Based Stream Processing Framework
 * Core implementation: graph definition, node processing, and safety checks.
 *
 * Guarantees:
 *  - Deterministic synchronous propagation (no async, no race conditions)
 *  - Cycle‑free topology (detected at connection time)
 *  - O(V + E) per event propagation where V = visited nodes, E = edges traversed
 *  - Pure TypeScript, no external dependencies
 */

export type Timestamp = number;

/** Basic event wrapper carrying a payload and a timestamp */
export interface Event<T> {
    readonly payload: T;
    readonly timestamp: Timestamp;
}

/** Operator function transforms an input event to an output event (or null to filter) */
export type OperatorFunction<I, O> = (event: Event<I>) => Event<O> | null;

/** Unique identifier for a node within a graph */
export type NodeId = string;

/**
 * Internal representation of a node.
 * Generic over input (I) and output (O) event payload types.
 */
class StreamNode<I, O> {
    readonly id: NodeId;
    readonly operator: OperatorFunction<I, O>;
    /** Downstream node identifiers */
    readonly downstream: Set<NodeId> = new Set();

    constructor(id: NodeId, operator: OperatorFunction<I, O>) {
        this.id = id;
        this.operator = operator;
    }
}

/**
 * Graph orchestrates nodes and edges, and drives event propagation.
 */
export class Graph {
    /** Map from node identifier to its StreamNode instance */
    private readonly nodes: Map<NodeId, StreamNode<any, any>> = new Map();

    /**
     * Register a new node.
     * @param id Unique identifier.
     * @param operator Transformation applied to incoming events.
     * @throws Error if id already exists.
     */
    addNode<I, O>(id: NodeId, operator: OperatorFunction<I, O>): void {
        if (this.nodes.has(id)) {
            throw new Error(`Node with id "${id}" already exists`);
        }
        this.nodes.set(id, new StreamNode(id, operator));
    }

    /**
     * Connect source node to target node (directed edge).
     * @throws Error if either node does not exist or if the connection would create a cycle.
     */
    connect(sourceId: NodeId, targetId: NodeId): void {
        const source = this.nodes.get(sourceId);
        const target = this.nodes.get(targetId);
        if (!source) throw new Error(`Source node "${sourceId}" not found`);
        if (!target) throw new Error(`Target node "${targetId}" not found`);

        // Temporarily add edge and test for cycles via DFS
        source.downstream.add(targetId);
        if (this.hasPath(targetId, sourceId)) {
            // Revert edge and raise
            source.downstream.delete(targetId);
            throw new Error(`Connecting "${sourceId}" → "${targetId}" would create a cycle`);
        }
    }

    /**
     * Emit an event into a source node, triggering synchronous propagation.
     * @param sourceId Identifier of the node where the event originates.
     * @param event Event to process.
     */
    emit<I>(sourceId: NodeId, event: Event<I>): void {
        const startNode = this.nodes.get(sourceId);
        if (!startNode) throw new Error(`Emit failed: node "${sourceId}" not found`);
        // Breadth‑first propagation using a queue to avoid deep recursion
        const queue: Array<{ nodeId: NodeId; event: Event<any> }> = [{ nodeId: sourceId, event }];
        while (queue.length > 0) {
            const { nodeId, event: currentEvent } = queue.shift()!;
            const node = this.nodes.get(nodeId)!;
            const outEvent = node.operator(currentEvent);
            if (outEvent === null) continue; // filtered out
            for (const downstreamId of node.downstream) {
                queue.push({ nodeId: downstreamId, event: outEvent });
            }
        }
    }

    /**
     * Helper: detect if there exists a directed path from startId to targetId.
     * Used for cycle detection.
     */
    private hasPath(startId: NodeId, targetId: NodeId): boolean {
        const visited = new Set<NodeId>();
        const stack: NodeId[] = [startId];
        while (stack.length) {
            const cur = stack.pop()!;
            if (cur === targetId) return true;
            if (visited.has(cur)) continue;
            visited.add(cur);
            const node = this.nodes.get(cur);
            if (!node) continue;
            for (const nxt of node.downstream) {
                stack.push(nxt);
            }
        }
        return false;
    }

    /** Utility for testing: retrieve downstream ids of a node */
    getDownstream(nodeId: NodeId): NodeId[] {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node "${nodeId}" not found`);
        return Array.from(node.downstream);
    }
}
