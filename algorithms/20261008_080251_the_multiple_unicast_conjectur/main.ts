import { buildCounterexample, maxEdgeDisjointRouting, codingCapacity, Graph } from './core.ts';

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Unit test suite
function runTests(): void {
    const { graph, pairs } = buildCounterexample();

    // Test individual max flows (should each be 1)
    const flow1 = codingCapacity(new Graph(graph.cloneAdj().get('s1') ? [] : []), [['s1', 't1']]); // dummy, we'll compute directly
    const f1 = maxFlow(graph, 's1', 't1');
    const f2 = maxFlow(graph, 's2', 't2');
    assert(f1 === 1, `Expected max flow s1→t1 = 1, got ${f1}`);
    assert(f2 === 1, `Expected max flow s2→t2 = 1, got ${f2}`);

    // Coding capacity (sum of individual max flows)
    const codingCap = codingCapacity(graph, pairs);
    assert(codingCap === 2, `Expected coding capacity = 2, got ${codingCap}`);

    // Routing capacity (edge‑disjoint paths)
    const routingCap = maxEdgeDisjointRouting(graph, pairs);
    assert(routingCap === 1, `Expected routing capacity = 1, got ${routingCap}`);

    // Verify conjecture is false for this instance
    assert(routingCap < codingCap, 'Routing capacity should be strictly less than coding capacity');
}

// Simple benchmark (optional)
function benchmark(): void {
    const { graph, pairs } = buildCounterexample();
    console.time('codingCapacity');
    const coding = codingCapacity(graph, pairs);
    console.timeEnd('codingCapacity');

    console.time('maxEdgeDisjointRouting');
    const routing = maxEdgeDisjointRouting(graph, pairs);
    console.timeEnd('maxEdgeDisjointRouting');

    console.log(`Coding capacity = ${coding}, Routing capacity = ${routing}`);
}

// Entry point
function main(): void {
    console.log('Running unit tests...');
    runTests();
    console.log('All tests passed.\n');

    console.log('Running benchmark...');
    benchmark();
}

main();
