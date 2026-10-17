import { getArcanaByDate, getArcanaByString, MAJOR_ARCANA, Arcana } from "./core";

/* Simple assertion helper */
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

/* Equality check for Arcana objects */
function arcanaEquals(a: Arcana, b: Arcana): boolean {
    return a.index === b.index && a.name === b.name;
}

/* Unit tests */
function runTests(): void {
    // Test 1: 1990-01-01 => index 12 (The Hanged Man)
    const d1 = new Date(1990, 0, 1); // month is zero‑based
    const a1 = getArcanaByDate(d1);
    const expected1 = MAJOR_ARCANA[12];
    assert(arcanaEquals(a1, expected1), `1990-01-01 should map to ${expected1.name}`);

    // Test 2: 2000-12-31 => index 19 (The Sun)
    const d2 = new Date(2000, 11, 31);
    const a2 = getArcanaByDate(d2);
    const expected2 = MAJOR_ARCANA[19];
    assert(arcanaEquals(a2, expected2), `2000-12-31 should map to ${expected2.name}`);

    // Test 3: 2023-07-15 => index 21 (The World)
    const d3 = new Date(2023, 6, 15);
    const a3 = getArcanaByDate(d3);
    const expected3 = MAJOR_ARCANA[21];
    assert(arcanaEquals(a3, expected3), `2023-07-15 should map to ${expected3.name}`);

    // Test 4: 2021-02-28 => index 5 (The Hierophant)
    const d4 = new Date(2021, 1, 28);
    const a4 = getArcanaByDate(d4);
    const expected4 = MAJOR_ARCANA[5];
    assert(arcanaEquals(a4, expected4), `2021-02-28 should map to ${expected4.name}`);

    // Test 5: String parsing
    const a5 = getArcanaByString("1990-01-01");
    assert(arcanaEquals(a5, expected1), `String "1990-01-01" should map to ${expected1.name}`);

    // Test 6: Invalid date string throws
    let threw = false;
    try {
        getArcanaByString("invalid-date");
    } catch (e) {
        threw = e instanceof RangeError;
    }
    assert(threw, "Invalid date string should throw RangeError");

    console.log("All unit tests passed.");
}

/* Simple benchmark */
function benchmark(iterations: number = 1_000_000): void {
    const start = performance.now();
    let dummy: Arcana | null = null;
    for (let i = 0; i < iterations; i++) {
        const date = new Date(1970 + (i % 50), i % 12, (i % 28) + 1);
        dummy = getArcanaByDate(date);
    }
    const end = performance.now();
    console.log(`Benchmark: ${iterations.toLocaleString()} iterations in ${(end - start).toFixed(2)} ms`);
    // Prevent optimizer from discarding loop
    if (dummy === null) console.log("Impossible");
}

/* Entry point */
function main(): void {
    runTests();
    benchmark();
}

main();
