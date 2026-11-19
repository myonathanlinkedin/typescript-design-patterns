import { solveBoundedKnapsack, BoundedItem } from './core';

// Simple assertion helper
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error('Assertion failed: ' + message);
    }
}

// Naïve exponential solver for verification on tiny instances
function solveBoundedKnapsackNaive(items: BoundedItem[], capacity: number): number {
    const n = items.length;
    let best = 0;
    function dfs(idx: number, remaining: number, value: number): void {
        if (idx === n) {
            if (value > best) best = value;
            return;
        }
        const { weight, value: val, bound } = items[idx];
        for (let k = 0; k <= bound && k * weight <= remaining; ++k) {
            dfs(idx + 1, remaining - k * weight, value + k * val);
        }
    }
    dfs(0, capacity, 0);
    return best;
}

// Unit tests
function runTests(): void {
    // Test 1: trivial zero capacity
    assert(solveBoundedKnapsack([], 0) === 0, 'Empty items, zero capacity');

    // Test 2: single item fits exactly
    const items1: BoundedItem[] = [{ weight: 5, value: 10, bound: 2 }];
    assert(solveBoundedKnapsack(items1, 10) === 20, 'Single item exact fit');

    // Test 3: bound limitation
    const items2: BoundedItem[] = [{ weight: 3, value: 4, bound: 1 }];
    assert(solveBoundedKnapsack(items2, 10) === 4, 'Bound prevents extra copies');

    // Test 4: multiple items, classic knapsack
    const items3: BoundedItem[] = [
        { weight: 2, value: 3, bound: 3 },
        { weight: 3, value: 4, bound: 2 },
        { weight: 4, value: 5, bound: 1 },
    ];
    const cap3 = 10;
    const expected3 = solveBoundedKnapsackNaive(items3, cap3);
    assert(solveBoundedKnapsack(items3, cap3) === expected3, 'Multiple items matches naive');

    // Test 5: zero‑weight item
    const items4: BoundedItem[] = [
        { weight: 0, value: 7, bound: 5 }, // adds 35 value for free
        { weight: 3, value: 4, bound: 2 },
    ];
    const cap4 = 6;
    const expected4 = 35 + 8; // take both weight‑3 items
    assert(solveBoundedKnapsack(items4, cap4) === expected4, 'Zero‑weight handling');

    // Test 6: random small instances compared against naive
    function randomInt(max: number): number {
        return Math.floor(Math.random() * (max + 1));
    }
    for (let t = 0; t < 100; ++t) {
        const n = randomInt(4) + 1;
        const items: BoundedItem[] = [];
        for (let i = 0; i < n; ++i) {
            items.push({
                weight: randomInt(5),
                value: randomInt(10),
                bound: randomInt(3),
            });
        }
        const cap = randomInt(15);
        const fast = solveBoundedKnapsack(items, cap);
        const slow = solveBoundedKnapsackNaive(items, cap);
        assert(fast === slow, `Random test ${t} failed`);
    }

    console.log('All tests passed.');
}

// Entry point
runTests();
