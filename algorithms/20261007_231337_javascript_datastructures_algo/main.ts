import * as assert from "assert";
import { MinHeap } from "./engine";

// Helper to test that a function throws
function assertThrows(fn: () => any, message?: string) {
    let threw = false;
    try {
        fn();
    } catch {
        threw = true;
    }
    assert.strictEqual(threw, true, message ?? "Expected function to throw");
}

// Test 1: Basic numeric heap operations
const numHeap = new MinHeap<number>();
assert.strictEqual(numHeap.isEmpty(), true);
assert.strictEqual(numHeap.size(), 0);
assert.strictEqual(numHeap.peek(), undefined);

numHeap.insert(5);
assert.strictEqual(numHeap.peek(), 5);
assert.strictEqual(numHeap.size(), 1);

numHeap.insert(3);
numHeap.insert(8);
numHeap.insert(1);
assert.strictEqual(numHeap.peek(), 1);
assert.strictEqual(numHeap.size(), 4);

assert.strictEqual(numHeap.extract(), 1);
assert.strictEqual(numHeap.extract(), 3);
assert.strictEqual(numHeap.extract(), 5);
assert.strictEqual(numHeap.extract(), 8);
assert.strictEqual(numHeap.isEmpty(), true);
assertThrows(() => numHeap.extract(), "Extract on empty heap should throw");

// Test 2: Duplicate values
const dupHeap = new MinHeap<number>();
dupHeap.insert(2);
dupHeap.insert(2);
dupHeap.insert(1);
assert.strictEqual(dupHeap.extract(), 1);
assert.strictEqual(dupHeap.extract(), 2);
assert.strictEqual(dupHeap.extract(), 2);
assertThrows(() => dupHeap.extract());

// Test 3: Custom comparator (max-heap behavior)
type Person = { name: string; age: number };
const ageDescComparator: (a: Person, b: Person) => number = (a, b) => b.age - a.age;
const personHeap = new MinHeap<Person>(ageDescComparator);

personHeap.insert({ name: "Alice", age: 30 });
personHeap.insert({ name: "Bob", age: 25 });
personHeap.insert({ name: "Charlie", age: 35 });

assert.strictEqual(personHeap.peek()!.name, "Charlie"); // oldest
assert.strictEqual(personHeap.extract()!.age, 35);
assert.strictEqual(personHeap.extract()!.age, 30);
assert.strictEqual(personHeap.extract()!.age, 25);
assertThrows(() => personHeap.peek());

// Test 4: Stress test with random numbers
const stressHeap = new MinHeap<number>();
const reference: number[] = [];
for (let i = 0; i < 1000; i++) {
    const val = Math.floor(Math.random() * 10000);
    stressHeap.insert(val);
    reference.push(val);
}
reference.sort((a, b) => a - b);
for (let i = 0; i < 1000; i++) {
    const extracted = stressHeap.extract();
    assert.strictEqual(extracted, reference[i], `Mismatch at index ${i}`);
}
assert.strictEqual(stressHeap.isEmpty(), true);

// Demo output
console.log("All heap tests passed successfully.");
