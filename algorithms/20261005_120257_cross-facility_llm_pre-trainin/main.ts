import { SimpleFacility, ElasticAggregator, DataChunk } from "./core";
import * as assert from "assert";

function createMockFacility(id: string, capacity: number, chunkCount: number): SimpleFacility {
    const fac = new SimpleFacility(id, capacity);
    for (let i = 0; i < chunkCount; i++) {
        const chunk: DataChunk = {
            id: `${id}-chunk-${i}`,
            size: 1,
            payload: `data-${i}`
        };
        fac.storeChunk(chunk);
    }
    return fac;
}

// Unit Tests
(async () => {
    // Setup
    const facA = createMockFacility("A", 100, 10);
    const facB = createMockFacility("B", 100, 10);
    const aggregator = new ElasticAggregator([facA, facB]);

    // Test facility listing
    assert.deepStrictEqual(aggregator.listFacilities().sort(), ["A", "B"]);

    // Test aggregation of existing chunks
    const targetIds = ["A-chunk-1", "B-chunk-3", "A-chunk-5"];
    const result = await aggregator.aggregate(targetIds);
    assert.strictEqual(result.length, targetIds.length);
    const resultIds = result.map(c => c.id).sort();
    assert.deepStrictEqual(resultIds, targetIds.sort());

    // Test adding a new facility
    const facC = createMockFacility("C", 100, 5);
    aggregator.addFacility(facC);
    assert.deepStrictEqual(aggregator.listFacilities().sort(), ["A", "B", "C"]);

    // Test removal
    aggregator.removeFacility("B");
    assert.deepStrictEqual(aggregator.listFacilities().sort(), ["A", "C"]);

    // Test aggregation after removal (should not fetch from B)
    const newTarget = ["A-chunk-2", "C-chunk-1"];
    const newResult = await aggregator.aggregate(newTarget);
    assert.strictEqual(newResult.length, newTarget.length);
    assert.deepStrictEqual(newResult.map(c => c.id).sort(), newTarget.sort());

    // Test lease expiration handling (internal, not exposed)
    // Force purge after TTL
    await new Promise(r => setTimeout(r, 6000));
    // No error expected; internal lease manager should have cleared expired leases
    // (We rely on absence of exceptions)

    console.log("All unit tests passed.");

    // Simple benchmark
    const largeFac = createMockFacility("L", 1000, 1000);
    const benchAgg = new ElasticAggregator([largeFac]);
    const manyIds = Array.from({ length: 500 }, (_, i) => `L-chunk-${i}`);
    const start = Date.now();
    await benchAgg.aggregate(manyIds);
    const duration = Date.now() - start;
    console.log(`Aggregated 500 chunks in ${duration} ms`);
})();
