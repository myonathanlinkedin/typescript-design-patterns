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
}

class Lexer {
    private pos = 0;
    private readonly input: string;
    constructor(input: string) {
        this.input = input;
    }

    private isAlpha(ch: string) {
        return /[a-zA-Z_]/.test(ch);
    }
    private isDigit(ch: string) {
        return /[0-9]/.test(ch);
    }
    private skipWhitespace() {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) this.pos++;
    }

    nextToken(): Token {
        this.skipWhitespace();
        if (this.pos >= this.input.length) return { type: TokenType.EOF, value: '' };
        const ch = this.input[this.pos];

        // Numbers (integers for simplicity)
        if (this.isDigit(ch)) {
            let start = this.pos;
            while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) this.pos++;
            return { type: TokenType.Number, value: this.input.slice(start, this.pos) };
        }

        // Identifiers
        if (this.isAlpha(ch)) {
            let start = this.pos;
            while (this.pos < this.input.length && (this.isAlpha(this.input[this.pos]) || this.isDigit(this.input[this.pos]))) this.pos++;
            return { type: TokenType.Identifier, value: this.input.slice(start, this.pos) };
        }

        // Single-char tokens
        this.pos++;
        switch (ch) {
            case '+':
            case '-':
            case '*':
            case '/':
                return { type: TokenType.Operator, value: ch };
            case '(':
                return { type: TokenType.LParen, value: ch };
            case ')':
                return { type: TokenType.RParen, value: ch };
            default:
                throw new Error(`Unexpected character: ${ch}`);
        }
    }
}

// AST node definitions
export type Expr =
    | NumberLiteral
    | Identifier
    | PrefixExpression
    | BinaryExpression;

export interface NumberLiteral {
    type: 'NumberLiteral';
    value: number;
}
export interface Identifier {
    type: 'Identifier';
    name: string;
}
export interface PrefixExpression {
    type: 'PrefixExpression';
    operator: string;
    right: Expr;
}
export interface BinaryExpression {
    type: 'BinaryExpression';
    operator: string;
    left: Expr;
    right: Expr;
}

// Pratt parser
enum Precedence {
    LOWEST = 0,
    SUM = 1,       // + -
    PRODUCT = 2,   // * /
    PREFIX = 3,    // -X
    CALL = 4,
}

const PRECEDENCES: Record<string, Precedence> = {
    '+': Precedence.SUM,
    '-': Precedence.SUM,
    '*': Precedence.PRODUCT,
    '/': Precedence.PRODUCT,
};

type PrefixParseFn = () => Expr;
type InfixParseFn = (left: Expr) => Expr;

export class Parser {
    private lexer: Lexer;
    private curToken!: Token;
    private peekToken!: Token;

    private prefixParseFns: Map<TokenType, PrefixParseFn> = new Map();
    private infixParseFns: Map<string, InfixParseFn> = new Map();

    constructor(input: string) {
        this.lexer = new Lexer(input);
        this.nextToken();
        this.nextToken(); // curToken and peekToken set

        // Register parse functions
        this.registerPrefix(TokenType.Number, this.parseNumberLiteral.bind(this));
        this.registerPrefix(TokenType.Identifier, this.parseIdentifier.bind(this));
        this.registerPrefix(TokenType.Operator, this.parsePrefixExpression.bind(this));
        this.registerPrefix(TokenType.LParen, this.parseGroupedExpression.bind(this));
    }

    private nextToken() {
        this.curToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    private registerPrefix(tokenType: TokenType, fn: PrefixParseFn) {
        this.prefixParseFns.set(tokenType, fn);
    }

    private registerInfix(operator: string, fn: InfixParseFn) {
        this.infixParseFns.set(operator, fn);
    }

    private curPrecedence(): Precedence {
        if (this.curToken.type === TokenType.Operator && PRECEDENCES[this.curToken.value] !== undefined) {
            return PRECEDENCES[this.curToken.value];
        }
        return Precedence.LOWEST;
    }

    private peekPrecedence(): Precedence {
        if (this.peekToken.type === TokenType.Operator && PRECEDENCES[this.peekToken.value] !== undefined) {
            return PRECEDENCES[this.peekToken.value];
        }
        return Precedence.LOWEST;
    }

    parseExpression(precedence = Precedence.LOWEST): Expr {
        const prefix = this.prefixParseFns.get(this.curToken.type);
        if (!prefix) throw new Error(`No prefix parse function for token: ${TokenType[this.curToken.type]}`);

        let left = prefix();

        while (
            this.peekToken.type !== TokenType.EOF &&
            precedence < this.peekPrecedence()
        ) {
            const infix = this.infixParseFns.get(this.peekToken.value);
            if (!infix) break;
            this.nextToken(); // advance to infix operator
            left = infix(left);
        }

        return left;
    }

    // Prefix parsers
    private parseNumberLiteral(): Expr {
        const value = parseInt(this.curToken.value, 10);
        const node: NumberLiteral = { type: 'NumberLiteral', value };
        this.nextToken();
        return node;
    }

    private parseIdentifier(): Expr {
        const node: Identifier = { type: 'Identifier', name: this.curToken.value };
        this.nextToken();
        return node;
    }

    private parsePrefixExpression(): Expr {
        const operator = this.curToken.value;
        this.nextToken();
        const right = this.parseExpression(Precedence.PREFIX);
        const node: PrefixExpression = { type: 'PrefixExpression', operator, right };
        return node;
    }

    private parseGroupedExpression(): Expr {
        this.nextToken(); // consume '('
        const expr = this.parseExpression();
        if (this.curToken.type !== TokenType.RParen) {
            throw new Error('Expected closing parenthesis');
        }
        this.nextToken(); // consume ')'
        return expr;
    }

    // Infix parser registration (called lazily on first use)
    private ensureInfixRegistered(operator: string) {
        if (!this.infixParseFns.has(operator)) {
            this.registerInfix(operator, this.parseInfixExpression.bind(this));
        }
    }

    private parseInfixExpression(left: Expr): Expr {
        const operator = this.curToken.value;
        const precedence = this.curPrecedence();
        this.nextToken(); // move past operator
        const right = this.parseExpression(precedence);
        const node: BinaryExpression = { type: 'BinaryExpression', operator, left, right };
        return node;
    }

    // Entry point
    parse(): Expr {
        // Register infix parsers on demand when first encountered
        const originalNextToken = this.nextToken.bind(this);
        this.nextToken = () => {
            originalNextToken();
            if (this.curToken.type === TokenType.Operator) {
                this.ensureInfixRegistered(this.curToken.value);
            }
        };
        const expr = this.parseExpression();
        if (this.curToken.type !== TokenType.EOF) {
            throw new Error('Unexpected tokens after expression');
        }
        return expr;
    }
}

// Convenience function
export function parse(input: string): Expr {
    const parser = new Parser(input);
    return parser.parse();
}
