import { Lexer, TokenType, Token, LexError } from "./core";

/** Simple assertion helper */
function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

/** Compare two token arrays for deep equality */
function assertTokensEqual(actual: Token[], expected: Token[]): void {
    assert(actual.length === expected.length, `Token count mismatch (got ${actual.length}, expected ${expected.length})`);
    for (let i = 0; i < actual.length; i++) {
        const a = actual[i];
        const e = expected[i];
        assert(a.type === e.type, `Token ${i} type mismatch (got ${a.type}, expected ${e.type})`);
        assert(a.value === e.value, `Token ${i} value mismatch (got '${a.value}', expected '${e.value}')`);
        assert(a.start === e.start && a.end === e.end,
            `Token ${i} span mismatch (got [${a.start},${a.end}), expected [${e.start},${e.end}))`);
    }
}

/** Unit test suite */
function runTests(): void {
    const lexer = new Lexer();

    // Test 1: empty input
    assertTokensEqual(lexer.tokenize(""), []);

    // Test 2: whitespace only
    assertTokensEqual(lexer.tokenize(" \t\n"), []);

    // Test 3: simple identifier
    assertTokensEqual(
        lexer.tokenize("foo"),
        [{ type: TokenType.Identifier, value: "foo", start: 0, end: 3 }]
    );

    // Test 4: identifier with digits and underscore
    assertTokensEqual(
        lexer.tokenize("_var123"),
        [{ type: TokenType.Identifier, value: "_var123", start: 0, end: 7 }]
    );

    // Test 5: numbers
    assertTokensEqual(
        lexer.tokenize("42 007"),
        [
            { type: TokenType.Number, value: "42", start: 0, end: 2 },
            { type: TokenType.Number, value: "007", start: 3, end: 6 }
        ]
    );

    // Test 6: operators and punctuation
    assertTokensEqual(
        lexer.tokenize("a+b*c;"),
        [
            { type: TokenType.Identifier, value: "a", start: 0, end: 1 },
            { type: TokenType.Operator, value: "+", start: 1, end: 2 },
            { type: TokenType.Identifier, value: "b", start: 2, end: 3 },
            { type: TokenType.Operator, value: "*", start: 3, end: 4 },
            { type: TokenType.Identifier, value: "c", start: 4, end: 5 },
            { type: TokenType.Punctuation, value: ";", start: 5, end: 6 }
        ]
    );

    // Test 7: multi‑character operators
    assertTokensEqual(
        lexer.tokenize("a==b && c!=d"),
        [
            { type: TokenType.Identifier, value: "a", start: 0, end: 1 },
            { type: TokenType.Operator, value: "==", start: 1, end: 3 },
            { type: TokenType.Identifier, value: "b", start: 3, end: 4 },
            { type: TokenType.Operator, value: "&&", start: 5, end: 7 },
            { type: TokenType.Identifier, value: "c", start: 8, end: 9 },
            { type: TokenType.Operator, value: "!=", start: 9, end: 11 },
            { type: TokenType.Identifier, value: "d", start: 11, end: 12 }
        ]
    );

    // Test 8: mixed whitespace handling
    assertTokensEqual(
        lexer.tokenize("  foo\t123\n+bar "),
        [
            { type: TokenType.Identifier, value: "foo", start: 2, end: 5 },
            { type: TokenType.Number, value: "123", start: 6, end: 9 },
            { type: TokenType.Operator, value: "+", start: 10, end: 11 },
            { type: TokenType.Identifier, value: "bar", start: 11, end: 14 }
        ]
    );

    // Test 9: error on unknown character
    let errorCaught = false;
    try {
        lexer.tokenize("hello$world");
    } catch (e) {
        errorCaught = e instanceof LexError && (e as LexError).position === 5;
    }
    assert(errorCaught, "Expected LexError on unknown character '$'");

    console.log("All tests passed.");
}

/** Entry point */
runTests();
