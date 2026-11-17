import { Tokenizer, TokenType, Parser, ASTNode } from "./core";
import * as assert from "assert";

/* ---------- Unit Tests ---------- */

function testTokenizerSimple() {
    const tokenizer = new Tokenizer();
    const input = "foo = 42 + bar_1";
    const tokens = tokenizer.tokenize(input);
    const types = tokens.map(t => t.type);
    const values = tokens.map(t => t.value);

    // Expected token sequence (excluding whitespace)
    const expectedTypes = [
        TokenType.Identifier,
        TokenType.Operator,
        TokenType.Number,
        TokenType.Operator,
        TokenType.Identifier,
        TokenType.EOF
    ];
    const expectedValues = ["foo", "=", "42", "+", "bar_1", ""];

    // Filter out whitespace tokens for comparison
    const filtered = tokens.filter(t => t.type !== TokenType.Whitespace);
    assert.deepStrictEqual(filtered.map(t => t.type), expectedTypes, "Token types mismatch");
    assert.deepStrictEqual(filtered.map(t => t.value), expectedValues, "Token values mismatch");
}

function testTokenizerNumbers() {
    const tokenizer = new Tokenizer();
    const inputs = ["123", "0.456", ".789", "12.34.56"];
    const results = inputs.map(s => tokenizer.tokenize(s));

    // 123 -> Number
    assert.strictEqual(results[0][0].type, TokenType.Number);
    assert.strictEqual(results[0][0].value, "123");

    // 0.456 -> Number
    assert.strictEqual(results[1][0].type, TokenType.Number);
    assert.strictEqual(results[1][0].value, "0.456");

    // .789 -> Unknown (leading dot not allowed in our simple lexer)
    assert.strictEqual(results[2][0].type, TokenType.Unknown);
    assert.strictEqual(results[2][0].value, ".");

    // 12.34.56 -> Number token "12.34" then Unknown ".56"
    assert.strictEqual(results[3][0].type, TokenType.Number);
    assert.strictEqual(results[3][0].value, "12.34");
    assert.strictEqual(results[3][1].type, TokenType.Unknown);
    assert.strictEqual(results[3][1].value, ".56");
}

function testParserSimpleExpression() {
    const tokenizer = new Tokenizer();
    const tokens = tokenizer.tokenize("a + 3 * (b - 2)");
    const parser = new Parser(tokens);
    const ast = parser.parseExpression();

    // Expected AST shape:
    // BinaryExpression('+')
    //   left: Identifier('a')
    //   right: BinaryExpression('*')
    //            left: NumberLiteral(3)
    //            right: ParenExpression
    //                     expression: BinaryExpression('-')
    //                                   left: Identifier('b')
    //                                   right: NumberLiteral(2)

    assert.strictEqual(ast.type, "BinaryExpression");
    const bin = ast as any;
    assert.strictEqual(bin.operator, "+");
    assert.strictEqual(bin.left.type, "Identifier");
    assert.strictEqual((bin.left as any).name, "a");
    assert.strictEqual(bin.right.type, "BinaryExpression");
    const rightBin = bin.right as any;
    assert.strictEqual(rightBin.operator, "*");
    assert.strictEqual(rightBin.left.type, "NumberLiteral");
    assert.strictEqual((rightBin.left as any).value, 3);
    assert.strictEqual(rightBin.right.type, "ParenExpression");
    const paren = rightBin.right as any;
    const inner = paren.expression as any;
    assert.strictEqual(inner.type, "BinaryExpression");
    assert.strictEqual(inner.operator, "-");
    assert.strictEqual(inner.left.type, "Identifier");
    assert.strictEqual(inner.left.name, "b");
    assert.strictEqual(inner.right.type, "NumberLiteral");
    assert.strictEqual(inner.right.value, 2);
}

function testParserErrors() {
    const tokenizer = new Tokenizer();

    // Missing closing parenthesis
    const tokens1 = tokenizer.tokenize("(1 + 2");
    const parser1 = new Parser(tokens1);
    assert.throws(() => parser1.parseExpression(), SyntaxError);

    // Unexpected token
    const tokens2 = tokenizer.tokenize("5 $ 3");
    const parser2 = new Parser(tokens2);
    assert.throws(() => parser2.parseExpression(), SyntaxError);
}

/* ---------- Execute Tests ---------- */
function runAllTests() {
    testTokenizerSimple();
    testTokenizerNumbers();
    testParserSimpleExpression();
    testParserErrors();
    console.log("All tests passed.");
}

runAllTests();
);
