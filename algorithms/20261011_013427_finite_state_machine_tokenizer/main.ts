import { Lexer } from "./engine";
import { TokenType } from "./types";
import * as assert from "assert";

function tokensToString(tokens: { type: TokenType; lexeme: string }[]): string {
    return tokens.map(t => `${t.type}(${t.lexeme})`).join(" ");
}

// Unit Tests
(() => {
    const lexer = new Lexer();

    // Test 1: Empty input
    let result = lexer.tokenize("");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, TokenType.EOF);

    // Test 2: Whitespace only
    result = lexer.tokenize(" \t\n\r");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, TokenType.EOF);

    // Test 3: Simple identifier
    result = lexer.tokenize("foo");
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], {
        type: TokenType.Identifier,
        lexeme: "foo",
        start: 0,
        end: 3
    });
    assert.strictEqual(result[1].type, TokenType.EOF);

    // Test 4: Identifier with digits and underscore
    result = lexer.tokenize("_var123");
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], {
        type: TokenType.Identifier,
        lexeme: "_var123",
        start: 0,
        end: 8
    });

    // Test 5: Integer and floating number
    result = lexer.tokenize("42 3.14 .5 6.");
    // Expected tokens: Number(42), Number(3.14), Unknown(.), Number(5), Number(6.), EOF
    const expected = [
        { type: TokenType.Number, lexeme: "42", start: 0, end: 2 },
        { type: TokenType.Number, lexeme: "3.14", start: 3, end: 7 },
        { type: TokenType.Unknown, lexeme: ".", start: 8, end: 9 },
        { type: TokenType.Number, lexeme: "5", start: 9, end: 10 },
        { type: TokenType.Number, lexeme: "6.", start: 11, end: 13 },
        { type: TokenType.EOF, lexeme: "", start: 13, end: 13 }
    ];
    assert.strictEqual(result.length, expected.length);
    for (let i = 0; i < expected.length; i++) {
        assert.deepStrictEqual(result[i], expected[i]);
    }

    // Test 6: Operators and unknown symbols
    result = lexer.tokenize("a+b*c - / % $");
    const expectedOps = [
        { type: TokenType.Identifier, lexeme: "a", start: 0, end: 1 },
        { type: TokenType.Operator, lexeme: "+", start: 1, end: 2 },
        { type: TokenType.Identifier, lexeme: "b", start: 2, end: 3 },
        { type: TokenType.Operator, lexeme: "*", start: 3, end: 4 },
        { type: TokenType.Identifier, lexeme: "c", start: 4, end: 5 },
        { type: TokenType.Operator, lexeme: "-", start: 6, end: 7 },
        { type: TokenType.Operator, lexeme: "/", start: 8, end: 9 },
        { type: TokenType.Operator, lexeme: "%", start: 10, end: 11 },
        { type: TokenType.Unknown, lexeme: "$", start: 12, end: 13 },
        { type: TokenType.EOF, lexeme: "", start: 13, end: 13 }
    ];
    assert.strictEqual(result.length, expectedOps.length);
    for (let i = 0; i < expectedOps.length; i++) {
        assert.deepStrictEqual(result[i], expectedOps[i]);
    }

    // Test 7: Mixed complex input
    const complex = "var1 = 100 + func_name(arg1, 2.0)";
    result = lexer.tokenize(complex);
    const expectedComplex = [
        { type: TokenType.Identifier, lexeme: "var1", start: 0, end: 4 },
        { type: TokenType.Operator, lexeme: "=", start: 5, end: 6 },
        { type: TokenType.Number, lexeme: "100", start: 7, end: 10 },
        { type: TokenType.Operator, lexeme: "+", start: 11, end: 12 },
        { type: TokenType.Identifier, lexeme: "func_name", start: 13, end: 22 },
        { type: TokenType.Operator, lexeme: "(", start: 22, end: 23 },
        { type: TokenType.Identifier, lexeme: "arg1", start: 23, end: 27 },
        { type: TokenType.Operator, lexeme: ",", start: 27, end: 28 },
        { type: TokenType.Number, lexeme: "2.0", start: 29, end: 32 },
        { type: TokenType.Operator, lexeme: ")", start: 32, end: 33 },
        { type: TokenType.EOF, lexeme: "", start: 33, end: 33 }
    ];
    assert.strictEqual(result.length, expectedComplex.length);
    for (let i = 0; i < expectedComplex.length; i++) {
        assert.deepStrictEqual(result[i], expectedComplex[i]);
    }

    // Demo output (non‑assertive)
    console.log("All lexer unit tests passed.");
    console.log("Demo tokenization:");
    const demo = "count = total + 42.5 * (a - b)";
    const demoTokens = lexer.tokenize(demo);
    console.log(tokensToString(demoTokens));
})();
