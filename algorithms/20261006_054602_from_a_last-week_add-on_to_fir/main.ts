import { PerformanceMetrics } from './core';
import * as assert from 'assert';

function runTests(): void {
    console.log('Running unit tests...');

    // Test RingBuffer basic functionality
    const rb = new (require('./core').RingBuffer<number>)(3);
    assert.strictEqual(rb.getSize(), 0);
    rb.push(1);
    rb.push(2);
    rb.push(3);
    assert.strictEqual(rb.getSize(), 3);
    assert.deepStrictEqual(rb.toArray(), [1, 2, 3]);
    rb.push(4); // overwrite oldest
    assert.deepStrictEqual(rb.toArray(), [2, 3, 4]);

    // Test PerformanceMetrics latency recording
    const pm = new PerformanceMetrics(5, 5);
    pm.recordLatency(10);
    pm.recordLatency(20);
    pm.recordLatency(30);
    const latencyStats = pm.getLatencyStats();
    assert.strictEqual(latencyStats.avg, 20);
    assert.strictEqual(latencyStats.median, 20);
    assert.strictEqual(latencyStats.p95, 30);
    assert.strictEqual(latencyStats.p99, 30);

    // Test PerformanceMetrics bandwidth recording
    pm.recordBandwidth(1000);
    pm.recordBandwidth(2000);
    pm.recordBandwidth(3000);
    const bandwidthStats = pm.getBandwidthStats();
    assert.strictEqual(bandwidthStats.avg, 2000);
    assert.strictEqual(bandwidthStats.median, 2000);
    assert.strictEqual(bandwidthStats.p95, 3000);
    assert.strictEqual(bandwidthStats.p99, 3000);

    // Test report generation
    const report = pm.getReport();
    assert.ok(report.includes('Latency (ms):'));
    assert.ok(report.includes('Bandwidth (bytes/s):'));

    console.log('All unit tests passed.');
}

function benchmark(): void {
    console.log('\nRunning benchmark simulation...');
    const pm = new PerformanceMetrics(10000, 10000);
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
        const latency = Math.random() * 100; // ms
        const bandwidth = Math.random() * 1e6; // bytes/s
        pm.recordLatency(latency);
        pm.recordBandwidth(bandwidth);
    }
    console.log(pm.getReport());
}

function main(): void {
    runTests();
    benchmark();
}

main();
