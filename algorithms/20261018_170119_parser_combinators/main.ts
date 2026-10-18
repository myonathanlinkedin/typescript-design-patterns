import {
    Parser,
    str,
    regex,
    map,
    flatMap,
    seq,
    or,
    many,
    many1,
    optional,
    token,
    run,
    numberParser,
    expr,
    fail,
    succeed
} from "./core";

function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

// Unit Tests
function testStr(): void {
    const p = str("hello");
    const r1 = p("hello world");
    assert(r1.success && r1.value === "hello" && r1.rest === " world", "str parser failed on match");
    const r2 = p("hi");
    assert(!r2.success, "str parser should fail on non‑match");
}
function testRegex(): void {
    const p = regex(/^[a-z]+/);
    const r = p("abc123");
    assert(r.success && r.value === "abc" && r.rest === "123", "regex parser failed");
}
function testMap(): void {
    const p = map(numberParser, (n) => n * 2);
    const v = run(p, "42");
    assert(v === 84, "map failed");
}
function testFlatMap(): void {
    const p = flatMap(str("a"), () => str("b"));
    const r = p("ab");
    assert(r.success && r.value === "b" && r.rest === "", "flatMap sequencing failed");
}
function testSeq(): void {
    const p = seq(str("x"), str("y"));
    const r = p("xyz");
    assert(r.success && r.value[0] === "x" && r.value[1] === "y" && r.rest === "z", "seq failed");
}
function testOr(): void {
    const p = or(str("foo"), str("bar"));
    assert(p("foobar").success && p("foobar").value === "foo", "or first branch failed");
    assert(p("barbaz").success && p("barbaz").value === "bar", "or second branch failed");
}
function testMany(): void {
    const p = many(str("a"));
    const r = p("aaab");
    assert(r.success && r.value.length === 3 && r.rest === "b", "many failed");
}
function testMany1(): void {
    const p = many1(str("x"));
    const r = p("xx");
    assert(r.success && r.value.length === 2, "many1 success case failed");
    const r2 = p("y");
    assert(!r2.success, "many1 should fail on zero repetitions");
}
function testOptional(): void {
    const p = optional(str("opt"));
    const r1 = p("opt123");
    assert(r1.success && r1.value === "opt" && r1.rest === "123", "optional present failed");
    const r2 = p("123");
    assert(r2.success && r2.value === undefined && r2.rest === "123", "optional absent failed");
}
function testToken(): void {
    const p = token(str("id"));
    const r = p("   id");
    assert(r.success && r.value === "id" && r.rest === "", "token whitespace handling failed");
}
function testNumberParser(): void {
    const v = run(numberParser, "  007");
    assert(v === 7, "numberParser failed");
}
function testExpr(): void {
    const cases: [string, number][] = [
        ["1+2*3", 7],
        ["(1+2)*3", 9],
        ["10/2-3", 2],
        [" 4 + 5 * (6 - 2) ", 24],
        ["42", 42],
        ["(8)", 8],
    ];
    for (const [src, expected] of cases) {
        const v = run(expr, src);
        assert(v === expected, `expr "${src}" expected ${expected} got ${v}`);
    }
}
function testFailurePropagation(): void {
    const p = flatMap(str("a"), () => fail<number>("forced"));
    const r = p("a");
    assert(!r.success && r.error === "forced", "failure propagation failed");
}

// Run all tests
function runAllTests(): void {
    console.time("tests");
    testStr();
    testRegex();
    testMap();
    testFlatMap();
    testSeq();
    testOr();
    testMany();
    testMany1();
    testOptional();
    testToken();
    testNumberParser();
    testExpr();
    testFailurePropagation();
    console.timeEnd("tests");
    console.log("All tests passed.");
}

// Simple benchmark for the arithmetic parser
function benchmark(): void {
    const exprStr = "1+2*3+4*5+6*7+8*9+10*11+12*13+14*15+16*17+18*19+20*21";
    console.time("benchmark");
    for (let i = 0; i < 10000; ++i) {
        const v = run(expr, exprStr);
        // Prevent dead‑code elimination
        if (v < 0) throw new Error("impossible");
    }
    console.timeEnd("benchmark");
}

// Entry point
runAllTests();
benchmark();
