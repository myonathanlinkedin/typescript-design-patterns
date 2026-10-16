/**
 * Unit test suite for Wingfoil core.
 * Executes without external test frameworks; uses simple assertions.
 */

import { Graph, Event, OperatorFunction } from "./core";

/** Minimal assertion helper */
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

/** Helper to create events with automatic timestamp */
function makeEvent<T>(payload: T): Event<T> {
    return { payload, timestamp: Date.now() };
}

/** Test 1: Simple map operation */
function testMap(): void {
    const g = new Graph();

    // Source node: identity (passes payload unchanged)
    const identity: OperatorFunction<number, number> = (e) => e;
    g.addNode("src", identity);

    // Map node: squares the number
    const square: OperatorFunction<number, number> = (e) => ({
        payload: e.payload * e.payload,
        timestamp: e.timestamp,
    });
    g.addNode("square", square);

    // Sink node: collects results
    const results: number[] = [];
    const sink: OperatorFunction<number, never> = (e) => {
        results.push(e.payload);
        return null; // terminal node, no further propagation
    };
    g.addNode("sink", sink);

    // Build topology src → square → sink
    g.connect("src", "square");
    g.connect("square", "sink");

    // Emit events
    g.emit("src", makeEvent(2));
    g.emit("src", makeEvent(3));
    g.emit("src", makeEvent(4));

    // Verify
    assert(results.length === 3, "Map test: expected 3 results");
    assert(results[0] === 4 && results[1] === 9 && results[2] === 16, "Map test: incorrect squares");
}

/** Test 2: Filter operation (null propagation) */
function testFilter(): void {
    const g = new Graph();

    const identity: OperatorFunction<number, number> = (e) => e;
    g.addNode("src", identity);

    // Filter out odd numbers
    const evenFilter: OperatorFunction<number, number> = (e) =>
        e.payload % 2 === 0 ? e : null;
    g.addNode("filter", evenFilter);

    const results: number[] = [];
    const sink: OperatorFunction<number, never> = (e) => {
        results.push(e.payload);
        return null;
    };
    g.addNode("sink", sink);

    g.connect("src", "filter");
    g.connect("filter", "sink");

    // Emit a mix of numbers
    [1, 2, 3, 4, 5, 6].forEach((n) => g.emit("src", makeEvent(n)));

    assert(results.length === 3, "Filter test: expected 3 even numbers");
    assert(results[0] === 2 && results[1] === 4 && results[2] === 6, "Filter test: wrong filtered values");
}

/** Test 3: Branching (fan‑out) */
function testBranching(): void {
    const g = new Graph();

    const identity: OperatorFunction<string, string> = (e) => e;
    g.addNode("src", identity);

    const toUpper: OperatorFunction<string, string> = (e) => ({
        payload: e.payload.toUpperCase(),
        timestamp: e.timestamp,
    });
    const toLower: OperatorFunction<string, string> = (e) => ({
        payload: e.payload.toLowerCase(),
        timestamp: e.timestamp,
    });
    g.addNode("upper", toUpper);
    g.addNode("lower", toLower);

    const upperRes: string[] = [];
    const lowerRes: string[] = [];

    const upperSink: OperatorFunction<string, never> = (e) => {
        upperRes.push(e.payload);
        return null;
    };
    const lowerSink: OperatorFunction<string, never> = (e) => {
        lowerRes.push(e.payload);
        return null;
    };
    g.addNode("upperSink", upperSink);
    g.addNode("lowerSink", lowerSink);

    // src branches to both upper and lower
    g.connect("src", "upper");
    g.connect("src", "lower");
    g.connect("upper", "upperSink");
    g.connect("lower", "lowerSink");

    g.emit("src", makeEvent("TeSt"));

    assert(upperRes.length === 1 && upperRes[0] === "TEST", "Branching upper result incorrect");
    assert(lowerRes.length === 1 && lowerRes[0] === "test", "Branching lower result incorrect");
}

/** Test 4: Cycle detection */
function testCycleDetection(): void {
    const g = new Graph();

    const id: OperatorFunction<number, number> = (e) => e;
    g.addNode("a", id);
    g.addNode("b", id);
    g.addNode("c", id);

    g.connect("a", "b");
    g.connect("b", "c");

    let caught = false;
    try {
        // Attempt to create a back edge forming a cycle a → b → c → a
        g.connect("c", "a");
    } catch (e) {
        caught = true;
        assert(
            (e as Error).message.includes("would create a cycle"),
            "Cycle detection error message mismatch"
        );
    }
    assert(caught, "Cycle detection failed to throw");
}

/** Test 5: No downstream (sink without explicit terminal) */
function testTerminalNode(): void {
    const g = new Graph();

    const id: OperatorFunction<number, number> = (e) => e;
    g.addNode("src", id);
    const results: number[] = [];
    const collector: OperatorFunction<number, never> = (e) => {
        results.push(e.payload);
        return null;
    };
    g.addNode("collector", collector);

    // Connect src → collector, but collector has no downstream nodes
    g.connect("src", "collector");

    g.emit("src", makeEvent(42));
    assert(results.length === 1 && results[0] === 42, "Terminal node did not collect payload");
}

/** Execute all tests */
function runAll(): void {
    testMap();
    testFilter();
    testBranching();
    testCycleDetection();
    testTerminalNode();
    console.log("All Wingfoil core tests passed.");
}

runAll();
