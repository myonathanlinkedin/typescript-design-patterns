import { Faststream } from "./engine";

/**
 * Simple assertion helper.
 */
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/**
 * Helper to compute median of a sorted array (naïve reference).
 */
function naiveMedian(sorted: number[]): number | null {
    const n = sorted.length;
    if (n === 0) return null;
    if (n % 2 === 1) return sorted[Math.floor(n / 2)];
    return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/**
 * Unit Tests
 */
function runTests(): void {
    // Test 1: Empty stream
    const fs1 = new Faststream();
    assert(fs1.getMedian() === null, "Median of empty stream should be null");

    // Test 2: Single element
    const fs2 = new Faststream();
    fs2.add(42);
    assert(fs2.getMedian() === 42, "Median after single insertion should be the element itself");

    // Test 3: Known sequence
    const seq = [5, 15, 1, 3];
    const expectedMedians = [5, 10, 5, 4];
    const fs3 = new Faststream();
    for (let i = 0; i < seq.length; i++) {
        fs3.add(seq[i]);
        const median = fs3.getMedian();
        assert(median === expectedMedians[i],
            `Median mismatch at step ${i + 1}: expected ${expectedMedians[i]}, got ${median}`);
        // Verify ordering invariant after each insertion
        assert(fs3._checkOrderingInvariant(),
            `Ordering invariant broken after step ${i + 1}`);
    }

    // Test 4: Random large stream vs naive median
    const fs4 = new Faststream();
    const naive: number[] = [];
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
        const val = Math.floor(Math.random() * 10000) - 5000; // range [-5000, 4999]
        fs4.add(val);
        naive.push(val);
        naive.sort((a, b) => a - b);
        const fastMedian = fs4.getMedian();
        const refMedian = naiveMedian(naive);
        assert(fastMedian === refMedian,
            `Median divergence at iteration ${i}: fast=${fastMedian}, naive=${refMedian}`);
        // Size invariant
        const sizes = fs4._debugSizes();
        const diff = Math.abs(sizes.lower - sizes.upper);
        assert(diff <= 1, `Size invariant broken at iteration ${i}: lower=${sizes.lower}, upper=${sizes.upper}`);
        // Ordering invariant
        assert(fs4._checkOrderingInvariant(),
            `Ordering invariant broken at iteration ${i}`);
    }

    // Test 5: Even number of elements median as average
    const fs5 = new Faststream();
    fs5.add(10);
    fs5.add(20);
    assert(fs5.getMedian() === 15, "Median of [10,20] should be 15");
    fs5.add(30);
    assert(fs5.getMedian() === 20, "Median of [10,20,30] should be 20");
    fs5.add(40);
    assert(fs5.getMedian() === 25, "Median of [10,20,30,40] should be 25");

    console.log("All Faststream tests passed.");
}

// Execute tests
runTests();
