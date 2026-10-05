import { EventBus, FaststreamClient, EventHandler } from './core';

// Simple assertion helper
function assert(condition: any, message?: string): void {
    if (!condition) {
        throw new Error(message ?? 'Assertion failed');
    }
}

// Test 1: publish/subscribe
async function testPublishSubscribe(): Promise<void> {
    const bus = new EventBus();
    const client = new FaststreamClient(bus);
    let received = false;
    client.subscribe<number>('test.event', (e) => {
        assert(e.payload === 42, 'Payload mismatch');
        received = true;
    });
    await client.publish('test.event', 42);
    // Allow microtasks to flush
    await new Promise((r) => setTimeout(r, 0));
    assert(received, 'Handler was not invoked');
}

// Test 2: request/response
async function testRequestResponse(): Promise<void> {
    const bus = new EventBus();
    const client = new FaststreamClient(bus);

    // Responder service
    client.subscribe<{ a: number; b: number }>('calc.add', async (e) => {
        const { a, b } = e.payload;
        const response = {
            requestId: e.meta?.requestId,
            result: a + b,
        };
        const respEvent = {
            type: '__faststream_response__',
            payload: response,
            timestamp: Date.now(),
        };
        await bus.emit(respEvent);
    });

    const sum = await client.request<{ a: number; b: number }, number>('calc.add', { a: 7, b: 5 });
    assert(sum === 12, 'Incorrect sum result');
}

// Test 3: multiple handlers
async function testMultipleHandlers(): Promise<void> {
    const bus = new EventBus();
    const client = new FaststreamClient(bus);
    const calls: string[] = [];

    const h1: EventHandler<string> = (e) => calls.push(`h1:${e.payload}`);
    const h2: EventHandler<string> = (e) => calls.push(`h2:${e.payload}`);

    client.subscribe('multi.event', h1);
    client.subscribe('multi.event', h2);
    await client.publish('multi.event', 'data');
    await new Promise((r) => setTimeout(r, 0));
    assert(calls.includes('h1:data') && calls.includes('h2:data'), 'Not all handlers called');
}

// Benchmark: emit many events
async function benchmarkEmit(count = 100_000): Promise<void> {
    const bus = new EventBus();
    const client = new FaststreamClient(bus);
    let counter = 0;
    client.subscribe('bench.event', () => { counter++; });
    const start = Date.now();
    for (let i = 0; i < count; i++) {
        await client.publish('bench.event', i);
    }
    // Ensure all handlers processed
    await new Promise((r) => setTimeout(r, 0));
    const duration = Date.now() - start;
    console.log(`Benchmark: ${count} events processed in ${duration}ms (avg ${duration / count}ms/event)`);
    assert(counter === count, 'Benchmark counter mismatch');
}

// Entry point
async function main(): Promise<void> {
    console.log('Running Faststream client tests...');
    await testPublishSubscribe();
    console.log('✔ testPublishSubscribe passed');
    await testRequestResponse();
    console.log('✔ testRequestResponse passed');
    await testMultipleHandlers();
    console.log('✔ testMultipleHandlers passed');
    await benchmarkEmit(50_000);
    console.log('All tests and benchmark completed successfully');
}

main().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
