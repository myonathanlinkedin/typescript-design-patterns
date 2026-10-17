import { Lexer, Parser, ASTNode, NumberNode, PrefixNode, InfixNode } from "./core";

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}
function astEquals(a: ASTNode, b: ASTNode): boolean {
    if (a instanceof NumberNode && b instanceof NumberNode) {
        return a.value === b.value;
    }
    if (a instanceof PrefixNode && b instanceof PrefixNode) {
        return a.operator === b.operator && astEquals(a.right, b.right);
    }
    if (a instanceof InfixNode && b instanceof InfixNode) {
        return (
            a.operator === b.operator &&
            astEquals(a.left, b.left) &&
            astEquals(a.right, b.right)
        );
    }
    return false;
}
function test(input: string, expected: ASTNode): void {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const result = parser.parse();
    assert(astEquals(result, expected), `Parsing "${input}"`);
}
function demo(): void {
    const expr = "3 + 4 * (2 - 1) ^ 2";
    const lexer = new Lexer(expr);
    const parser = new Parser(lexer);
    const ast = parser.parse();
    console.log(JSON.stringify(ast, null, 2));
}
function runTests(): void {
    test("42", new NumberNode(42));
    test("-5", new PrefixNode("-", new NumberNode(5)));
    test("1+2", new InfixNode(new NumberNode(1), "+", new NumberNode(2)));
    test("2*3+4", new InfixNode(new InfixNode(new NumberNode(2), "*", new NumberNode(3)), "+", new NumberNode(4)));
    test("2+3*4", new InfixNode(new NumberNode(2), "+", new InfixNode(new NumberNode(3), "*", new NumberNode(4))));
    test("2^3^2", new InfixNode(new NumberNode(2), "^", new InfixNode(new NumberNode(3), "^", new NumberNode(2))));
    test("(1+2)*3", new InfixNode(new InfixNode(new NumberNode(1), "+", new NumberNode(2)), "*", new NumberNode(3)));
    console.log("All tests passed.");
}
runTests();
demo();
