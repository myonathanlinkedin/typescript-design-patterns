import { sequentialPrefixSum, parallelPrefixSum, Timer } from './core';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

function arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

async function testSequential(): Promise<void> {
    const arr = [1, 2, 3, 4, 5];
    const expected = [1, 3, 6, 10, 15];
    const result = sequentialPrefixSum(arr);
    assert(arraysEqual(result, expected), 'Sequential prefix sum failed');
}

async function testParallel(): Promise<void> {
    const arr = Array.from({ length: 1000 }, (_, i) => i + 1);
    const expected = sequentialPrefixSum(arr);
    const result = await parallelPrefixSum(arr, 4);
    assert(arraysEqual(result, expected), 'Parallel prefix sum failed');
}

async function testEmpty(): Promise<void> {
    const arr: number[] = [];
    const result = sequentialPrefixSum(arr);
    assert(result.length === 0, 'Empty array test failed');
}

async function testSingle(): Promise<void> {
    const arr = [42];
    const result = sequentialPrefixSum(arr);
    assert(result.length === 1 && result[0] === 42, 'Single element test failed');
}

async function testLarge(): Promise<void> {
    const size = 1_000_000;
    const arr = new Array(size).fill(1);
    const result = sequentialPrefixSum(arr);
    assert(result[size - 1] === size, 'Large array test failed');
}

async function benchmark(): Promise<void> {
    const size = 10_000_000;
    const arr = new Array(size).fill(1);
    const timer = new Timer();
    timer.start();
    sequentialPrefixSum(arr);
    timer.stop();
    console.log(`Sequential prefix sum of ${size} elements took ${timer.elapsed().toFixed(2)} ms`);
    timer.start();
    await parallelPrefixSum(arr, 8);
    timer.stop();
    console.log(`Parallel prefix sum of ${size} elements took ${timer.elapsed().toFixed(2)} ms`);
}

async function main(): Promise<void> {
    try {
        await testSequential();
        await testParallel();
        await testEmpty();
        await testSingle();
        await testLarge();
        console.log('All tests passed.');
        await benchmark();
    } catch (e) {
        console.error('Test failed:', e);
    }
}

if (require.main === module) {
    main();
}
