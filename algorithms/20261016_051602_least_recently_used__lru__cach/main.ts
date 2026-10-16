import { LRUCache } from './core';
import * as assert from 'assert';

/* ---------- Unit Tests ---------- */
function testBasicOperations(): void {
  const cache = new LRUCache<string, number>(2);
  assert.strictEqual(cache.size(), 0);

  cache.put('a', 1);
  assert.strictEqual(cache.get('a'), 1);
  assert.strictEqual(cache.size(), 1);

  cache.put('b', 2);
  assert.strictEqual(cache.get('b'), 2);
  assert.strictEqual(cache.size(), 2);

  // Access 'a' to make it most recent
  assert.strictEqual(cache.get('a'), 1);
  // Insert third key, should evict 'b' (least recent)
  cache.put('c', 3);
  assert.strictEqual(cache.get('b'), undefined);
  assert.strictEqual(cache.get('c'), 3);
  assert.strictEqual(cache.get('a'), 1);
  assert.strictEqual(cache.size(), 2);
}

function testUpdateExistingKey(): void {
  const cache = new LRUCache<number, string>(3);
  cache.put(1, 'one');
  cache.put(2, 'two');
  cache.put(3, 'three');

  // Update key 2 and ensure it becomes most recent
  cache.put(2, 'TWO');
  assert.strictEqual(cache.get(2), 'TWO');

  // Insert new key, should evict key 1 (least recent)
  cache.put(4, 'four');
  assert.strictEqual(cache.get(1), undefined);
  assert.strictEqual(cache.get(3), 'three');
  assert.strictEqual(cache.get(4), 'four');
}

function testDelete(): void {
  const cache = new LRUCache<string, boolean>(2);
  cache.put('x', true);
  cache.put('y', false);
  assert.strictEqual(cache.delete('x'), true);
  assert.strictEqual(cache.get('x'), undefined);
  assert.strictEqual(cache.size(), 1);
  // Deleting non‑existent key returns false
  assert.strictEqual(cache.delete('z'), false);
}

function testZeroCapacity(): void {
  const cache = new LRUCache<number, number>(0);
  cache.put(1, 100);
  assert.strictEqual(cache.get(1), undefined);
  assert.strictEqual(cache.size(), 0);
}

function testLargeRandomOperations(): void {
  const capacity = 1000;
  const ops = 100_000;
  const cache = new LRUCache<number, number>(capacity);
  const reference = new Map<number, number>();

  for (let i = 0; i < ops; ++i) {
    const key = Math.floor(Math.random() * 2000);
    const value = i;
    if (Math.random() < 0.5) {
      // put
      cache.put(key, value);
      reference.set(key, value);
      if (reference.size > capacity) {
        // Simulate LRU eviction in reference map (approximate)
        // Not needed for correctness of this test; we only verify that
        // cache never throws and returns either undefined or a value.
      }
    } else {
      // get
      const cached = cache.get(key);
      const expected = reference.get(key);
      if (expected !== undefined) {
        assert.strictEqual(cached, expected);
      }
    }
  }
}

/* ---------- Simple Benchmark ---------- */
function benchmark(): void {
  const capacity = 10_000;
  const ops = 1_000_000;
  const cache = new LRUCache<number, number>(capacity);
  console.time('LRUCache benchmark');
  for (let i = 0; i < ops; ++i) {
    const key = i % (capacity * 2);
    cache.put(key, i);
    cache.get(key);
  }
  console.timeEnd('LRUCache benchmark');
}

/* ---------- Execute Tests ---------- */
function runAll(): void {
  console.log('Running LRUCache unit tests...');
  testBasicOperations();
  testUpdateExistingKey();
  testDelete();
  testZeroCapacity();
  testLargeRandomOperations();
  console.log('All unit tests passed.');

  console.log('Running benchmark (may take a moment)...');
  benchmark();
}

runAll();
