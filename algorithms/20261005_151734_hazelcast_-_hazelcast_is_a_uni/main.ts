import { DistributedMap, StreamProcessor } from './core';

// Simple assertion helper
function assert(condition: any, message?: string): void {
    if (!condition) {
        throw new Error(message ?? 'Assertion failed');
    }
}

// Unit Tests
(async () => {
    // Test DistributedMap basic operations
    const map = new DistributedMap<string, number>();
    await map.set('a', 1);
    await map.set('b', 2);
    assert((await map.get('a')) === 1, 'Map get a');
    assert((await map.get('b')) === 2, 'Map get b');

    const events: Array<string> = [];
    const unsub = map.on((e) => events.push(`${e.type}:${String(e.key)}`));
    await map.set('c', 3);
    await map.delete('a');
    unsub();

    assert(events.includes('put:c'), 'Event put:c recorded');
    assert(events.includes('delete:a'), 'Event delete:a recorded');

    const entries = await map.entries();
    assert(entries.length === 2, 'Map entries count after delete');

    // Test StreamProcessor
    const source = new DistributedMap<number, number>();
    const target = new DistributedMap<number, number>();
    const processor = async (x: number) => x * x; // square numbers

    const stream = new StreamProcessor(source, target, processor);
    await source.set(1, 2);
    await source.set(2, 3);
    await source.delete(1);

    // Allow async propagation
    await new Promise((r) => setTimeout(r, 10));

    const val2 = await target.get(2);
    const val1 = await target.get(1);
    assert(val2 === 9, 'Processed value for key 2 should be 9');
    assert(val1 === undefined, 'Deleted source key should be removed from target');

    stream.stop();

    // Benchmark: insert 100k entries and process
    const benchSource = new DistributedMap<number, number>();
    const benchTarget = new DistributedMap<number, number>();
    const benchProcessor = (x: number) => x + 1;
    const benchStream = new StreamProcessor(benchSource, benchTarget, benchProcessor);

    const N = 100_000;
    const start = Date.now();
    for (let i = 0; i < N; i++) {
        await benchSource.set(i, i);
    }
    // Wait for all async processing to finish
    await new Promise((r) => setTimeout(r, 100));
    const duration = Date.now() - start;
    const sample = await benchTarget.get(N - 1);
    assert(sample === N, 'Benchmark final value correctness');

    console.log(`Benchmark: processed ${N} entries in ${duration} ms`);

    // Clean exit
    benchStream.stop();
    console.log('All tests passed.');
})();
