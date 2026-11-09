export enum TokenKind {
    Number,
    Plus,
    Minus,
    Multiply,
    Divide,
    LParen,
    RParen,
    EOF
}

export interface Token {
    kind: TokenKind;
    value?: number;
}

class Lexer {
    private pos: number = 0;
    private readonly length: number;

    constructor(private readonly input: string) {
        this.length = input.length;
    }

    private peek(): string {
        return this.pos < this.length ? this.input[this.pos] : '\0';
    }

    private advance(): void {
        this.pos++;
    }

    private skipWhitespace(): void {
        while (/\s/.test(this.peek())) {
            this.advance();
        }
    }

    private readNumber(): number {
        let start = this.pos;
        while (/\d/.test(this.peek())) {
            this.advance();
        }
        const substr = this.input.slice(start, this.pos);
        // Leading zeros are allowed; parseInt handles them.
        return parseInt(substr, 10);
    }

    public nextToken(): Token {
        this.skipWhitespace();

        const ch = this.peek();

        if (ch === '\0') {
            return { kind: TokenKind.EOF };
        }

        if (/\d/.test(ch)) {
            const num = this.readNumber();
            return { kind: TokenKind.Number, value: num };
        }

        this.advance(); // consume current char

        switch (ch) {
            case '+': return { kind: TokenKind.Plus };
            case '-': return { kind: TokenKind.Minus };
            case '*': return { kind: TokenKind.Multiply };
            case '/': return { kind: TokenKind.Divide };
            case '(': return { kind: TokenKind.LParen };
            case ')': return { kind: TokenKind.RParen };
            default:
                throw new Error(`Unrecognized character '${ch}' at position ${this.pos - 1}`);
        }
    }
}

// AST node definitions
export type ASTNode = NumberNode | BinaryOpNode | UnaryOpNode;

export interface NumberNode {
    type: 'Number';
    value: number;
}

export interface BinaryOpNode {
    type: 'BinaryOp';
    operator: TokenKind.Plus | TokenKind.Minus | TokenKind.Multiply | TokenKind.Divide;
    left: ASTNode;
    right: ASTNode;
}

export interface UnaryOpNode {
    type: 'UnaryOp';
    operator: TokenKind.Plus | TokenKind.Minus;
    operand: ASTNode;
}

export class Parser {
    private lexer: Lexer;
    private current: Token;

    constructor(input: string) {
        this.lexer = new Lexer(input);
        this.current = this.lexer.nextToken();
    }

    private eat(expected: TokenKind): void {
        if (this.current.kind === expected) {
            this.current = this.lexer.nextToken();
        } else {
            throw new Error(`Expected token ${TokenKind[expected]}, got ${TokenKind[this.current.kind]}`);
        }
    }

    public parse(): ASTNode {
        const node = this.expr();
        if (this.current.kind !== TokenKind.EOF) {
            throw new Error('Unexpected trailing input after parsing complete expression');
        }
        return node;
    }

    // expr := term (('+'|'-') term)*
    private expr(): ASTNode {
        let node = this.term();
        while (this.current.kind === TokenKind.Plus || this.current.kind === TokenKind.Minus) {
            const op = this.current.kind as TokenKind.Plus | TokenKind.Minus;
            this.eat(op);
            const right = this.term();
            node = { type: 'BinaryOp', operator: op, left: node, right };
        }
        return node;
    }

    // term := factor (('*'|'/') factor)*
    private term(): ASTNode {
        let node = this.factor();
        while (this.current.kind === TokenKind.Multiply || this.current.kind === TokenKind.Divide) {
            const op = this.current.kind as TokenKind.Multiply | TokenKind.Divide;
            this.eat(op);
            const right = this.factor();
            node = { type: 'BinaryOp', operator: op, left: node, right };
        }
        return node;
    }

    // factor := Number | '(' expr ')' | ('+'|'-') factor
    private factor(): ASTNode {
        const tok = this.current;
        if (tok.kind === TokenKind.Number) {
            const value = tok.value!;
            this.eat(TokenKind.Number);
            return { type: 'Number', value };
        }

        if (tok.kind === TokenKind.LParen) {
            this.eat(TokenKind.LParen);
            const node = this.expr();
            this.eat(TokenKind.RParen);
            return node;
        }

        if (tok.kind === TokenKind.Plus || tok.kind === TokenKind.Minus) {
            const op = tok.kind as TokenKind.Plus | TokenKind.Minus;
            this.eat(op);
            const operand = this.factor();
            // Unary plus is a no-op; we still create a node for uniformity.
            return { type: 'UnaryOp', operator: op, operand };
        }

        throw new Error(`Unexpected token ${TokenKind[tok.kind]} in factor`);
    }
}

// Evaluator
export function evaluate(node: ASTNode): number {
    switch (node.type) {
        case 'Number':
            return node.value;
        case 'UnaryOp': {
            const val = evaluate(node.operand);
            return node.operator === TokenKind.Plus ? +val : -val;
        }
        case 'BinaryOp': {
            const left = evaluate(node.left);
            const right = evaluate(node.right);
            switch (node.operator) {
                case TokenKind.Plus: return left + right;
                case TokenKind.Minus: return left - right;
                case TokenKind.Multiply: return left * right;
                case TokenKind.Divide:
                    if (right === 0) {
                        throw new Error('Division by zero');
                    }
                    return left / right;
                default:
                    throw new Error('Unknown binary operator');
            }
        }
        default:
            // Exhaustiveness check
            const _exhaustive: never = node;
            return _exhaustive;
    }
}
