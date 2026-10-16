import { Tokenizer, Parser, TokenType, Token, Statement } from "./core";
import * as assert from "assert";

// Helper to compare token arrays (type & value)
function tokensEqual(actual: Token[], expected: { type: TokenType; value: string }[]): void {
    assert.strictEqual(actual.length, expected.length, `Token count mismatch`);
    for (let i = 0; i < actual.length; i++) {
        assert.strictEqual(actual[i].type, expected[i].type, `Token ${i} type`);
        assert.strictEqual(actual[i].value, expected[i].value, `Token ${i} value`);
    }
}

// Unit Tests
function runTests(): void {
    const tokenizer = new Tokenizer();

    // Test 1: Simple identifier and number
    let input = "foo123 456";
    let tokens = tokenizer.tokenize(input);
    tokensEqual(tokens, [
        { type: TokenType.Identifier, value: "foo123" },
        { type: TokenType.Number, value: "456" }
    ]);

    // Test 2: Operators and whitespace handling
    input = "a+b -c* d/ e; ";
    tokens = tokenizer.tokenize(input);
    tokensEqual(tokens, [
        { type: TokenType.Identifier, value: "a" },
        { type: TokenType.Operator, value: "+" },
        { type: TokenType.Identifier, value: "b" },
        { type: TokenType.Operator, value: "-" },
        { type: TokenType.Identifier, value: "c" },
        { type: TokenType.Operator, value: "*" },
        { type: TokenType.Identifier, value: "d" },
        { type: TokenType.Operator, value: "/" },
        { type: TokenType.Identifier, value: "e" },
        { type: TokenType.Operator, value: ";" }
    ]);

    // Test 3: Floating point numbers and edge cases
    input = ".5 3.1415 42.";
    tokens = tokenizer.tokenize(input);
    tokensEqual(tokens, [
        { type: TokenType.Number, value: ".5" },
        { type: TokenType.Number, value: "3.1415" },
        { type: TokenType.Unknown, value: "42." } // trailing dot invalid
    ]);

    // Test 4: Unknown characters
    input = "foo @ bar #";
    tokens = tokenizer.tokenize(input);
    tokensEqual(tokens, [
        { type: TokenType.Identifier, value: "foo" },
        { type: TokenType.Unknown, value: "@" },
        { type: TokenType.Identifier, value: "bar" },
        { type: TokenType.Unknown, value: "#" }
    ]);

    // Test 5: Parser statement splitting
    const parser = new Parser();
    input = "x = 1; y = x + 2; z;";
    tokens = tokenizer.tokenize(input);
    const statements: Statement[] = parser.parse(tokens);
    assert.strictEqual(statements.length, 3, "Statement count");

    // Verify each statement token count
    assert.strictEqual(statements[0].tokens.length, 5, "Stmt0 token count");
    assert.strictEqual(statements[1].tokens.length, 7, "Stmt1 token count");
    assert.strictEqual(statements[2].tokens.length, 2, "Stmt2 token count");

    // Verify last token of each statement is a semicolon (except possibly last)
    assert.strictEqual(statements[0].tokens[4].value, ";");
    assert.strictEqual(statements[1].tokens[6].value, ";");
    // Third statement ends with identifier 'z' (no semicolon)
    assert.strictEqual(statements[2].tokens[1].type, TokenType.Identifier);
    assert.strictEqual(statements[2].tokens[1].value, "z");

    // Test 6: Empty input
    input = "";
    tokens = tokenizer.tokenize(input);
    assert.strictEqual(tokens.length, 0, "Empty input yields no tokens");
    const emptyStmts = parser.parse(tokens);
    assert.strictEqual(emptyStmts.length, 0, "Empty input yields no statements");

    console.log("All tests passed.");
}

// Simple benchmark (optional, not part of assertions)
function benchmark(): void {
    const tokenizer = new Tokenizer();
    const largeInput = "var x = 12345; ".repeat(10000); // ~200k chars
    const start = Date.now();
    const tokens = tokenizer.tokenize(largeInput);
    const duration = Date.now() - start;
    console.log(`Tokenized ${largeInput.length} chars into ${tokens.length} tokens in ${duration} ms`);
}

// Execute
runTests();
benchmark();
