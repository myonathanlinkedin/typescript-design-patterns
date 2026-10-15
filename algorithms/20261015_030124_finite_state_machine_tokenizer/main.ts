import { Tokenizer, TokenKind, Token } from "./core";

// Simple assertion utility
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

// AST node definitions
enum NodeKind {
    NumberLiteral = "NumberLiteral",
    Identifier = "Identifier",
    BinaryExpression = "BinaryExpression"
}

interface ASTNode {
    kind: NodeKind;
}
interface NumberLiteralNode extends ASTNode {
    kind: NodeKind.NumberLiteral;
    value: number;
}
interface IdentifierNode extends ASTNode {
    kind: NodeKind.Identifier;
    name: string;
}
interface BinaryExpressionNode extends ASTNode {
    kind: NodeKind.BinaryExpression;
    operator: string;
    left: ASTNode;
    right: ASTNode;
}
type ExprNode = NumberLiteralNode | IdentifierNode | BinaryExpressionNode;

// Recursive‑descent parser with precedence handling
class Parser {
    private readonly tokens: Token[];
    private pos: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(offset: number = 0): Token {
        const idx = this.pos + offset;
        return idx < this.tokens.length ? this.tokens[idx] : { kind: TokenKind.EOF, lexeme: "", position: -1 };
    }

    private advance(): Token {
        const cur = this.peek();
        this.pos++;
        return cur;
    }

    private match(...kinds: TokenKind[]): boolean {
        const cur = this.peek();
        if (kinds.includes(cur.kind)) {
            this.advance();
            return true;
        }
        return false;
    }

    // Entry point
    public parseExpression(): ExprNode {
        return this.parsePrecedence(0);
    }

    // Operator precedence table
    private getPrecedence(op: string): number {
        switch (op) {
            case "*":
            case "/":
                return 2;
            case "+":
            case "-":
                return 1;
            default:
                return 0;
        }
    }

    // Pratt‑style precedence parsing
    private parsePrecedence(minPrec: number): ExprNode {
        let left = this.parsePrimary();

        while (true) {
            const next = this.peek();
            if (next.kind !== TokenKind.Operator) break;
            const prec = this.getPrecedence(next.lexeme);
            if (prec < minPrec) break;

            const opToken = this.advance(); // consume operator
            const right = this.parsePrecedence(prec + 1);
            left = {
                kind: NodeKind.BinaryExpression,
                operator: opToken.lexeme,
                left,
                right
            } as BinaryExpressionNode;
        }

        return left;
    }

    private parsePrimary(): ExprNode {
        const cur = this.peek();

        if (cur.kind === TokenKind.Number) {
            this.advance();
            return {
                kind: NodeKind.NumberLiteral,
                value: Number(cur.lexeme)
            } as NumberLiteralNode;
        }

        if (cur.kind === TokenKind.Identifier) {
            this.advance();
            return {
                kind: NodeKind.Identifier,
                name: cur.lexeme
            } as IdentifierNode;
        }

        if (cur.kind === TokenKind.LParen) {
            this.advance(); // '('
            const expr = this.parseExpression();
            if (!this.match(TokenKind.RParen)) {
                throw new Error(`Expected ')' after expression at position ${this.peek().position}`);
            }
            return expr;
        }

        throw new Error(`Unexpected token '${cur.lexeme}' of kind ${cur.kind} at position ${cur.position}`);
    }
}

// ---------- Unit Tests ----------
function testTokenizerBasic(): void {
    const src = "foo + 42 * (bar - 7)";
    const tokenizer = new Tokenizer(src);
    const tokens = tokenizer.tokenize();

    const expectedKinds = [
        TokenKind.Identifier,
        TokenKind.Operator,
        TokenKind.Number,
        TokenKind.Operator,
        TokenKind.LParen,
        TokenKind.Identifier,
        TokenKind.Operator,
        TokenKind.Number,
        TokenKind.RParen,
        TokenKind.EOF
    ];

    assert(tokens.length === expectedKinds.length, "Token count mismatch");
    for (let i = 0; i < expectedKinds.length; i++) {
        assert(tokens[i].kind === expectedKinds[i],
            `Token ${i} expected ${expectedKinds[i]}, got ${tokens[i].kind}`);
    }
}

function testTokenizerEdgeCases(): void {
    // Empty input
    const empty = new Tokenizer("").tokenize();
    assert(empty.length === 1 && empty[0].kind === TokenKind.EOF, "Empty input should yield only EOF");

    // Unknown character
    let threw = false;
    try {
        new Tokenizer("@").tokenize();
    } catch (e) {
        threw = true;
    }
    assert(threw, "Tokenizer should throw on unknown character");
}

function testParserSimple(): void {
    const src = "a + b * 3";
    const tokens = new Tokenizer(src).tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parseExpression();

    // Expected AST: (a) + ((b) * (3))
    assert(ast.kind === NodeKind.BinaryExpression, "Root should be binary expression");
    const root = ast as BinaryExpressionNode;
    assert(root.operator === "+", "Root operator should be '+'");
    assert(root.left.kind === NodeKind.Identifier && (root.left as IdentifierNode).name === "a", "Left operand should be identifier 'a'");
    assert(root.right.kind === NodeKind.BinaryExpression, "Right operand should be binary expression");
    const right = root.right as BinaryExpressionNode;
    assert(right.operator === "*", "Right operator should be '*'");
    assert(right.left.kind === NodeKind.Identifier && (right.left as IdentifierNode).name === "b", "Right-left should be identifier 'b'");
    assert(right.right.kind === NodeKind.NumberLiteral && (right.right as NumberLiteralNode).value === 3, "Right-right should be number 3");
}

function testParserParentheses(): void {
    const src = "(x + y) * 2";
    const tokens = new Tokenizer(src).tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parseExpression();

    // Expected: ((x + y) ) * 2
    assert(ast.kind === NodeKind.BinaryExpression, "Root should be binary expression");
    const root = ast as BinaryExpressionNode;
    assert(root.operator === "*", "Root operator should be '*'");
    assert(root.right.kind === NodeKind.NumberLiteral && (root.right as NumberLiteralNode).value === 2, "Right operand should be number 2");
    const left = root.left as BinaryExpressionNode;
    assert(left.operator === "+", "Left sub‑operator should be '+'");
    assert(left.left.kind === NodeKind.Identifier && (left.left as IdentifierNode).name === "x", "Left-left should be 'x'");
    assert(left.right.kind === NodeKind.Identifier && (left.right as IdentifierNode).name === "y", "Left-right should be 'y'");
}

// Run all tests
function runTests(): void {
    testTokenizerBasic();
    testTokenizerEdgeCases();
    testParserSimple();
    testParserParentheses();
    console.log("All tests passed.");
}

// Entry point
runTests();
