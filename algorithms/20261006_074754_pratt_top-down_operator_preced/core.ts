export enum TokenType {
    Number,
    Identifier,
    Operator,
    LParen,
    RParen,
    EOF,
}

export interface Token {
    type: TokenType;
    value: string;
    pos: number;
}

export class Lexer {
    private pos = 0;
    private readonly input: string;
    constructor(input: string) {
        this.input = input;
    }
    private isDigit(ch: string): boolean {
        return ch >= '0' && ch <= '9';
    }
    private isAlpha(ch: string): boolean {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
    }
    private skipWhitespace(): void {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
            this.pos++;
        }
    }
    nextToken(): Token {
        this.skipWhitespace();
        if (this.pos >= this.input.length) {
            return { type: TokenType.EOF, value: '', pos: this.pos };
        }
        const ch = this.input[this.pos];
        if (this.isDigit(ch)) {
            let start = this.pos;
            while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
                this.pos++;
            }
            return { type: TokenType.Number, value: this.input.slice(start, this.pos), pos: start };
        }
        if (this.isAlpha(ch)) {
            let start = this.pos;
            while (this.pos < this.input.length && this.isAlpha(this.input[this.pos])) {
                this.pos++;
            }
            return { type: TokenType.Identifier, value: this.input.slice(start, this.pos), pos: start };
        }
        if (ch === '(') {
            this.pos++;
            return { type: TokenType.LParen, value: '(', pos: this.pos - 1 };
        }
        if (ch === ')') {
            this.pos++;
            return { type: TokenType.RParen, value: ')', pos: this.pos - 1 };
        }
        // Operators: + - * / ^ and unary minus handled in parser
        if ('+-*/^'.includes(ch)) {
            this.pos++;
            return { type: TokenType.Operator, value: ch, pos: this.pos - 1 };
        }
        throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
    }
}

export type ASTNode =
    | NumberLiteral
    | Identifier
    | BinaryExpression
    | UnaryExpression
    | Grouping;

export interface NumberLiteral {
    type: 'NumberLiteral';
    value: number;
}

export interface Identifier {
    type: 'Identifier';
    name: string;
}

export interface BinaryExpression {
    type: 'BinaryExpression';
    operator: string;
    left: ASTNode;
    right: ASTNode;
}

export interface UnaryExpression {
    type: 'UnaryExpression';
    operator: string;
    argument: ASTNode;
}

export interface Grouping {
    type: 'Grouping';
    expression: ASTNode;
}

const PRECEDENCE: Record<string, number> = {
    '^': 4,
    '*': 3,
    '/': 3,
    '+': 2,
    '-': 2,
};

export class Parser {
    private lexer: Lexer;
    private lookahead: Token;
    constructor(input: string) {
        this.lexer = new Lexer(input);
        this.lookahead = this.lexer.nextToken();
    }
    private consume(expected?: TokenType): Token {
        const current = this.lookahead;
        if (expected !== undefined && current.type !== expected) {
            throw new Error(`Expected token type ${TokenType[expected]}, got ${TokenType[current.type]} at position ${current.pos}`);
        }
        this.lookahead = this.lexer.nextToken();
        return current;
    }
    private parsePrimary(): ASTNode {
        const token = this.lookahead;
        switch (token.type) {
            case TokenType.Number:
                this.consume(TokenType.Number);
                return { type: 'NumberLiteral', value: Number(token.value) };
            case TokenType.Identifier:
                this.consume(TokenType.Identifier);
                return { type: 'Identifier', name: token.value };
            case TokenType.Operator:
                if (token.value === '-') {
                    this.consume(TokenType.Operator);
                    const arg = this.parsePrimary();
                    return { type: 'UnaryExpression', operator: '-', argument: arg };
                }
                throw new Error(`Unexpected operator '${token.value}' at position ${token.pos}`);
            case TokenType.LParen:
                this.consume(TokenType.LParen);
                const expr = this.parseExpression(0);
                this.consume(TokenType.RParen);
                return { type: 'Grouping', expression: expr };
            default:
                throw new Error(`Unexpected token ${TokenType[token.type]} at position ${token.pos}`);
        }
    }
    parseExpression(minPrecedence: number): ASTNode {
        let left = this.parsePrimary();
        while (this.lookahead.type === TokenType.Operator && PRECEDENCE[this.lookahead.value] >= minPrecedence) {
            const opToken = this.consume(TokenType.Operator);
            const op = opToken.value;
            const precedence = PRECEDENCE[op];
            const nextMin = op === '^' ? precedence : precedence + 1;
            const right = this.parseExpression(nextMin);
            left = { type: 'BinaryExpression', operator: op, left, right };
        }
        return left;
    }
    parse(): ASTNode {
        const expr = this.parseExpression(0);
        if (this.lookahead.type !== TokenType.EOF) {
            throw new Error(`Unexpected token after expression at position ${this.lookahead.pos}`);
        }
        return expr;
    }
}

export function parse(input: string): ASTNode {
    const parser = new Parser(input);
    return parser.parse();
}
