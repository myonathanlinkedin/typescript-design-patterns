import { Lexer } from "./engine";
import { TokenType, Token } from "./types";
import * as assert from "assert";

function tokensEqual(actual: Token[], expected: { type: TokenType; lexeme: string }[]): void {
    assert.strictEqual(actual.length, expected.length + 1, "Token count mismatch (including EOF)");
    for (let i = 0; i < expected.length; i++) {
        const act = actual[i];
        const exp = expected[i];
        assert.strictEqual(act.type, exp.type, `Token ${i} type mismatch`);
        assert.strictEqual(act.lexeme, exp.lexeme, `Token ${i} lexeme mismatch`);
    }
    // Verify EOF token
    const eof = actual[actual.length - 1];
    assert.strictEqual(eof.type, TokenType.EOF, "Last token should be EOF");
    assert.strictEqual(eof.lexeme, "", "EOF token lexeme should be empty");
}

// Unit tests
(function runTests() {
    const lexer = new Lexer();

    // Test 1: Empty input
    let tokens = lexer.tokenize("");
    tokensEqual(tokens, []);

    // Test 2: Single identifier
    tokens = lexer.tokenize("abc");
    tokensEqual(tokens, [{ type: TokenType.Identifier, lexeme: "abc" }]);

    // Test 3: Single number
    tokens = lexer.tokenize("12345");
    tokensEqual(tokens, [{ type: TokenType.Number, lexeme: "12345" }]);

    // Test 4: Mixed expression
    const expr = "a1b2 + (c3 - 45) * 6";
    tokens = lexer.tokenize(expr);
    tokensEqual(tokens, [
        { type: TokenType.Identifier, lexeme: "a1b2" },
        { type: TokenType.Operator, lexeme: "+" },
        { type: TokenType.LeftParen, lexeme: "(" },
        { type: TokenType.Identifier, lexeme: "c3" },
        { type: TokenType.Operator, lexeme: "-" },
        { type: TokenType.Number, lexeme: "45" },
        { type: TokenType.RightParen, lexeme: ")" },
        { type: TokenType.Operator, lexeme: "*" },
        { type: TokenType.Number, lexeme: "6" }
    ]);

    // Test 5: Whitespace only
    tokens = lexer.tokenize("   \t\n");
    tokensEqual(tokens, []);

    // Test 6: Invalid character should throw
    let threw = false;
    try {
        lexer.tokenize("foo$");
    } catch (e) {
        threw = true;
        assert.ok(e instanceof Error, "Exception should be an Error");
        assert.ok(/Unrecognized character/.test((e as Error).message));
    }
    assert.ok(threw, "Lexer should throw on invalid character");

    console.log("All unit tests passed.");
})();

// Demo usage
(function demo() {
    const lexer = new Lexer();
    const source = "sum = a1 + 42 * (b - c2)";
    const tokens = lexer.tokenize(source);
    console.log("Demo tokenization:");
    for (const t of tokens) {
        console.log(`  [${t.type}] '${t.lexeme}' (pos ${t.position})`);
    }
})();
