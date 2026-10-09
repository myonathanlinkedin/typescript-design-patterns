import { tokenize } from "./engine";
import { Parser } from "./engine";
import { ASTNode, NumberLiteral, PrefixExpression, BinaryExpression } from "./types";

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

// Helper to parse and return AST
function parse(input: string): ASTNode {
    const tokens = tokenize(input);
    const parser = new Parser(tokens);
    const ast = parser.parseExpression();
    return ast;
}

// Test cases
function runTests() {
    // 1. Simple number
    let ast = parse("42");
    assert(ast.type === "NumberLiteral", "42 should be NumberLiteral");
    assert((ast as NumberLiteral).value === 42, "Number value should be 42");

    // 2. Simple addition
    ast = parse("1+2");
    assert(ast.type === "BinaryExpression", "1+2 should be BinaryExpression");
    const bin1 = ast as BinaryExpression;
    assert(bin1.operator === "+", "Operator should be +");
    assert((bin1.left as NumberLiteral).value === 1, "Left operand should be 1");
    assert((bin1.right as NumberLiteral).value === 2, "Right operand should be 2");

    // 3. Precedence: 1+2*3 => 1 + (2*3)
    ast = parse("1+2*3");
    const expected3: BinaryExpression = {
        type: "BinaryExpression",
        operator: "+",
        left: { type: "NumberLiteral", value: 1 },
        right: {
            type: "BinaryExpression",
            operator: "*",
            left: { type: "NumberLiteral", value: 2 },
            right: { type: "NumberLiteral", value: 3 },
        },
    };
    assert(deepEqual(ast, expected3), "1+2*3 AST structure mismatch");

    // 4. Parentheses: (1+2)*3
    ast = parse("(1+2)*3");
    const expected4: BinaryExpression = {
        type: "BinaryExpression",
        operator: "*",
        left: {
            type: "BinaryExpression",
            operator: "+",
            left: { type: "NumberLiteral", value: 1 },
            right: { type: "NumberLiteral", value: 2 },
        },
        right: { type: "NumberLiteral", value: 3 },
    };
    assert(deepEqual(ast, expected4), "(1+2)*3 AST structure mismatch");

    // 5. Prefix minus: -5
    ast = parse("-5");
    const expected5: PrefixExpression = {
        type: "PrefixExpression",
        operator: "-",
        right: { type: "NumberLiteral", value: 5 },
    };
    assert(deepEqual(ast, expected5), "-5 AST structure mismatch");

    // 6. Right-associative exponent: 2^3^2 => 2 ^ (3 ^ 2)
    ast = parse("2^3^2");
    const expected6: BinaryExpression = {
        type: "BinaryExpression",
        operator: "^",
        left: { type: "NumberLiteral", value: 2 },
        right: {
            type: "BinaryExpression",
            operator: "^",
            left: { type: "NumberLiteral", value: 3 },
            right: { type: "NumberLiteral", value: 2 },
        },
    };
    assert(deepEqual(ast, expected6), "2^3^2 AST structure mismatch");

    console.log("All tests passed.");
}

// Demo
function demo() {
    const expr = "3 + 4 * (2 - 1)";
    const ast = parse(expr);
    console.log("Expression:", expr);
    console.log("AST:", JSON.stringify(ast, null, 2));
}

runTests();
demo();
