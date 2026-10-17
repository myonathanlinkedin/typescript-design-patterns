import { LRUCache } from './core';
import * as assert from 'assert';

/* ---------- Unit Tests ---------- */
function testBasicOperations(): void {
    const cache = new LRUCache<number, string>(2);
    cache.put(1, 'one');
    cache.put(2, 'two');

    assert.strictEqual(cache.get(1), 'one', 'Get existing key 1');
    assert.deepStrictEqual(cache.keys(), [1, 2], 'Order after accessing 1');

    cache.put(3, 'three'); // should evict key 2
    assert.strictEqual(cache.get(2), undefined, 'Key 2 evicted');
    assert.deepStrictEqual(cache.keys(), [3, 1], 'Order after eviction');

    cache.put(1, 'ONE'); // update existing key moves to head
    assert.strictEqual(cache.get(1), 'ONE', 'Updated value for key 1');
    assert.deepStrictEqual(cache.keys(), [1, 3], 'Order after updating 1');
}

function testCapacityZero(): void {
    const cache = new LRUCache<string, number>(0);
    cache.put('a', 1);
    assert.strictEqual(cache.size(), 0, 'Cache remains empty with zero capacity');
    assert.strictEqual(cache.get('a'), undefined, 'Get returns undefined');
}

function testLargeSequence(): void {
    const capacity = 100;
    const cache = new LRUCache<number, number>(capacity);
    const totalOps = 1000;

    for (let i = 0; i < totalOps; ++i) {
        cache.put(i, i * i);
        // Random access pattern
        const key = Math.floor(Math.random() * i);
        cache.get(key);
    }

    assert.strictEqual(cache.size(), capacity, 'Size equals capacity after many ops');
    // Verify that the most recent `capacity` keys are present
    for (let i = totalOps - capacity; i < totalOps; ++i) {
        assert.strictEqual(cache.get(i), i * i, `Key ${i} should be present`);
    }
}

function testOrderIntegrity(): void {
    const cache = new LRUCache<string, string>(3);
    cache.put('a', 'A');
    cache.put('b', 'B');
    cache.put('c', 'C');
    assert.deepStrictEqual(cache.keys(), ['c', 'b', 'a'], 'Initial order');

    cache.get('a'); // a becomes most recent
    assert.deepStrictEqual(cache.keys(), ['a', 'c', 'b'], 'Order after accessing a');

    cache.put('d', 'D'); // evicts least recent (b)
    assert.deepStrictEqual(cache.keys(), ['d', 'a', 'c'], 'Order after inserting d');
    assert.strictEqual(cache.get('b'), undefined, 'b evicted');
}

/* ---------- Run Tests ---------- */
function runAllTests(): void {
    testBasicOperations();
    testCapacityZero();
    testLargeSequence();
    testOrderIntegrity();
    console.log('All LRUCache unit tests passed.');
}

/* ---------- Simple Benchmark (optional) ---------- */
function benchmark(): void {
    const ops = 1_000_000;
    const cache = new LRUCache<number, number>(10_000);
    console.time('LRUCache benchmark');
    for (let i = 0; i < ops; ++i) {
        cache.put(i, i);
        cache.get(i - 1);
    }
    console.timeEnd('LRUCache benchmark');
}

/* ---------- Entry Point ---------- */
function main(): void {
    runAllTests();
    benchmark();
}

main();
