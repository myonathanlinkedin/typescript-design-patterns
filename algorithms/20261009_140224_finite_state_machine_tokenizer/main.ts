import { FSMTokenizer, TokenType, Parser, ASTNode } from "./core";

function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/* ---------- Unit Tests ---------- */

function testTokenizerSimple(): void {
    const src = "foo + 42 * (bar - 7)";
    const tokenizer = new FSMTokenizer(src);
    const tokens = tokenizer.tokenizeAll();

    const expectedTypes = [
        TokenType.Identifier,
        TokenType.Operator,
        TokenType.Number,
        TokenType.Operator,
        TokenType.LParen,
        TokenType.Identifier,
        TokenType.Operator,
        TokenType.Number,
        TokenType.RParen,
        TokenType.EOF
    ];
    assert(tokens.length === expectedTypes.length, "Token count mismatch");
    for (let i = 0; i < expectedTypes.length; i++) {
        assert(tokens[i].type === expectedTypes[i], `Token ${i} type expected ${expectedTypes[i]}, got ${tokens[i].type}`);
    }
    assert(tokens[0].value === "foo", "Identifier value mismatch");
    assert(tokens[2].value === "42", "Number value mismatch");
    assert(tokens[4].type === TokenType.LParen, "Left parenthesis missing");
}

function testTokenizerEdgeCases(): void {
    // Empty input
    const empty = new FSMTokenizer("").tokenizeAll();
    assert(empty.length === 1 && empty[0].type === TokenType.EOF, "Empty input should yield only EOF");

    // Invalid character
    let threw = false;
    try {
        new FSMTokenizer("@").nextToken();
    } catch (e) {
        threw = true;
    }
    assert(threw, "Tokenizer should throw on unknown character");
}

function testParserSimple(): void {
    const src = "a + b * 3";
    const tokens = new FSMTokenizer(src).tokenizeAll();
    const parser = new Parser(tokens);
    const ast = parser.parseExpression();

    // Expected AST: (a) + ((b) * (3))
    assert(ast.type === "BinaryExpression", "Root should be binary expression");
    const root = ast as any;
    assert(root.operator === "+", "Root operator should be '+'");
    assert(root.left.type === "Identifier" && root.left.name === "a", "Left operand mismatch");
    assert(root.right.type === "BinaryExpression", "Right operand should be binary expression");
    const right = root.right as any;
    assert(right.operator === "*", "Right operator should be '*'");
    assert(right.left.type === "Identifier" && right.left.name === "b", "Right left operand mismatch");
    assert(right.right.type === "Number" && right.right.value === 3, "Right right operand mismatch");
}

function testParserParentheses(): void {
    const src = "(x + y) * 2";
    const tokens = new FSMTokenizer(src).tokenizeAll();
    const parser = new Parser(tokens);
    const ast = parser.parseExpression();

    // Expected AST: ((x + y)) * 2
    assert(ast.type === "BinaryExpression", "Root should be binary expression");
    const root = ast as any;
    assert(root.operator === "*", "Root operator should be '*'");
    assert(root.right.type === "Number" && root.right.value === 2, "Right operand mismatch");
    const left = root.left as any;
    assert(left.type === "BinaryExpression" && left.operator === "+", "Left subexpression mismatch");
    assert(left.left.type === "Identifier" && left.left.name === "x", "Left identifier mismatch");
    assert(left.right.type === "Identifier" && left.right.name === "y", "Right identifier mismatch");
}

/* ---------- Benchmark (optional) ---------- */
function benchmarkTokenizer(iterations: number = 10000): void {
    const src = "var1 + var2 * (var3 - 12345) / foo_bar";
    console.time("Tokenizer benchmark");
    for (let i = 0; i < iterations; i++) {
        new FSMTokenizer(src).tokenizeAll();
    }
    console.timeEnd("Tokenizer benchmark");
}

/* ---------- Test Runner ---------- */
function runAllTests(): void {
    console.log("Running tokenizer simple test...");
    testTokenizerSimple();
    console.log("Running tokenizer edge cases test...");
    testTokenizerEdgeCases();
    console.log("Running parser simple test...");
    testParserSimple();
    console.log("Running parser parentheses test...");
    testParserParentheses();
    console.log("All tests passed.");
    benchmarkTokenizer(2000);
}

runAllTests();
