import { Lexer } from "./engine";
import { Token, TokenType } from "./types";
import * as assert from "assert";

/**
 * Helper to extract only the token types (excluding EOF) for concise assertions.
 */
function tokenTypes(tokens: Token[]): TokenType[] {
    return tokens.map(t => t.type);
}

/**
 * Helper to extract lexemes (excluding EOF) for detailed assertions.
 */
function tokenLexemes(tokens: Token[]): string[] {
    return tokens.map(t => t.lexeme);
}

/* ---------- Unit Tests ---------- */

// Test 1: Empty input → only EOF token
{
    const lexer = new Lexer("");
    const tokens = lexer.tokenize();
    assert.strictEqual(tokens.length, 1, "Empty input should produce exactly one token (EOF)");
    assert.strictEqual(tokens[0].type, TokenType.EOF);
    assert.strictEqual(tokens[0].lexeme, "");
}

// Test 2: Whitespace only → only EOF token
{
    const lexer = new Lexer(" \t\n\r  ");
    const tokens = lexer.tokenize();
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, TokenType.EOF);
}

// Test 3: Simple identifier and number
{
    const lexer = new Lexer("foo 123");
    const tokens = lexer.tokenize();
    const expectedTypes = [TokenType.Identifier, TokenType.Number, TokenType.EOF];
    const expectedLexemes = ["foo", "123", ""];
    assert.deepStrictEqual(tokenTypes(tokens), expectedTypes);
    assert.deepStrictEqual(tokenLexemes(tokens), expectedLexemes);
    assert.strictEqual(tokens[0].position, 0);
    assert.strictEqual(tokens[1].position, 4);
}

// Test 4: Operators and parentheses
{
    const lexer = new Lexer("(a+b)*c - 42 / (d)");
    const tokens = lexer.tokenize();
    const expectedTypes = [
        TokenType.LeftParen,
        TokenType.Identifier,
        TokenType.Operator,
        TokenType.Identifier,
        TokenType.RightParen,
        TokenType.Operator,
        TokenType.Identifier,
        TokenType.Operator,
        TokenType.Number,
        TokenType.Operator,
        TokenType.LeftParen,
        TokenType.Identifier,
        TokenType.RightParen,
        TokenType.EOF
    ];
    const expectedLexemes = [
        "(", "a", "+", "b", ")", "*", "c", "-", "42", "/", "(", "d", ")", ""
    ];
    assert.deepStrictEqual(tokenTypes(tokens), expectedTypes);
    assert.deepStrictEqual(tokenLexemes(tokens), expectedLexemes);
}

// Test 5: Identifier with digits after first character
{
    const lexer = new Lexer("var123 _ignored");
    // '_' is not part of the defined grammar → should raise an error at position 6
    let errorCaught = false;
    try {
        lexer.tokenize();
    } catch (e) {
        errorCaught = true;
        assert.ok(e instanceof Error);
        assert.strictEqual((e as Error).message, "Lexical error at position 6: unexpected character '_'");
    }
    assert.ok(errorCaught, "Lexer must reject unsupported characters");
}

// Test 6: Long number with leading zeros
{
    const lexer = new Lexer("00012345");
    const tokens = lexer.tokenize();
    const expectedTypes = [TokenType.Number, TokenType.EOF];
    const expectedLexemes = ["00012345", ""];
    assert.deepStrictEqual(tokenTypes(tokens), expectedTypes);
    assert.deepStrictEqual(tokenLexemes(tokens), expectedLexemes);
    assert.strictEqual(tokens[0].position, 0);
}

// Test 7: Mixed token stream with consecutive operators (error)
{
    const lexer = new Lexer("a++b");
    // The second '+' is valid as an operator, but there is no rule forbidding consecutive operators.
    // Our lexer treats each '+' as a separate Operator token.
    const tokens = lexer.tokenize();
    const expectedTypes = [
        TokenType.Identifier,
        TokenType.Operator,
        TokenType.Operator,
        TokenType.Identifier,
        TokenType.EOF
    ];
    const expectedLexemes = ["a", "+", "+", "b", ""];
    assert.deepStrictEqual(tokenTypes(tokens), expectedTypes);
    assert.deepStrictEqual(tokenLexemes(tokens), expectedLexemes);
}

// Test 8: Position tracking correctness
{
    const lexer = new Lexer("x1 (y2)z3");
    const tokens = lexer.tokenize();
    const positions = tokens.map(t => t.position);
    const expectedPositions = [0, 3, 4, 5, 8]; // x1 at 0, '(' at 3, y2 at 4, ')' at 6 (but token after is identifier at 7), z3 at 7, EOF at 9
    // Let's compute actual expected positions precisely:
    // Input: 0:x 1:1 2:space 3:( 4:y 5:2 6:) 7:z 8:3
    // Tokens: Identifier(x1) pos0, LeftParen '(' pos3, Identifier(y2) pos4, RightParen ')' pos6, Identifier(z3) pos7, EOF pos9
    const expectedPos = [0, 3, 4, 6, 7, 9];
    assert.deepStrictEqual(positions, expectedPos);
}

// Demo: Tokenize a sample expression and print results (no assertion)
{
    const sample = "sum = a1 + (b2 - 34) * 5";
    const lexer = new Lexer(sample);
    const tokens = lexer.tokenize();
    console.log("Sample input:", sample);
    console.log("Tokens:");
    for (const t of tokens) {
        console.log(`  [${t.type}] '${t.lexeme}' @ ${t.position}`);
    }
}

// If the script reaches this point without throwing, all tests passed.
console.log("All unit tests passed.");
