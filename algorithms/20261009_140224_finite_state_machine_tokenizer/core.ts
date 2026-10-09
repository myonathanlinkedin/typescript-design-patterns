export enum TokenType {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    LParen = "LParen",
    RParen = "RParen",
    EOF = "EOF"
}

export interface Token {
    type: TokenType;
    value: string;
    start: number; // inclusive
    end: number;   // exclusive
}

function isLetter(ch: string): boolean {
    const code = ch.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || ch === "_";
}
function isDigit(ch: string): boolean {
    const code = ch.charCodeAt(0);
    return code >= 48 && code <= 57;
}
function isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}
function isOperator(ch: string): boolean {
    return "+-*/".includes(ch);
}
function isParen(ch: string): boolean {
    return ch === "(" || ch === ")";
}

/**
 * Deterministic Finite Automaton based tokenizer.
 * Produces a stream of Tokens from an input string.
 */
export class FSMTokenizer {
    private readonly input: string;
    private pos: number = 0;
    private readonly length: number;

    constructor(input: string) {
        this.input = input;
        this.length = input.length;
    }

    /** Return the next token, or EOF token if input exhausted. */
    public nextToken(): Token {
        this.skipWhitespace();

        if (this.isEOF()) {
            return { type: TokenType.EOF, value: "", start: this.pos, end: this.pos };
        }

        const start = this.pos;
        const ch = this.peek();

        // Identifier: letter or '_' followed by letters, digits, or '_'
        if (isLetter(ch)) {
            this.consume(); // first char
            while (!this.isEOF() && (isLetter(this.peek()) || isDigit(this.peek()))) {
                this.consume();
            }
            const end = this.pos;
            return {
                type: TokenType.Identifier,
                value: this.input.slice(start, end),
                start,
                end
            };
        }

        // Number: sequence of digits (integer only for simplicity)
        if (isDigit(ch)) {
            this.consume();
            while (!this.isEOF() && isDigit(this.peek())) {
                this.consume();
            }
            const end = this.pos;
            return {
                type: TokenType.Number,
                value: this.input.slice(start, end),
                start,
                end
            };
        }

        // Operator
        if (isOperator(ch)) {
            this.consume();
            const end = this.pos;
            return {
                type: TokenType.Operator,
                value: ch,
                start,
                end
            };
        }

        // Parentheses
        if (isParen(ch)) {
            this.consume();
            const end = this.pos;
            return {
                type: ch === "(" ? TokenType.LParen : TokenType.RParen,
                value: ch,
                start,
                end
            };
        }

        // Unknown character
        throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
    }

    /** Produce all tokens until EOF (including EOF token). */
    public tokenizeAll(): Token[] {
        const tokens: Token[] = [];
        while (true) {
            const tok = this.nextToken();
            tokens.push(tok);
            if (tok.type === TokenType.EOF) break;
        }
        return tokens;
    }

    private peek(): string {
        return this.input.charAt(this.pos);
    }

    private consume(): void {
        this.pos++;
    }

    private skipWhitespace(): void {
        while (!this.isEOF() && isWhitespace(this.peek())) {
            this.consume();
        }
    }

    private isEOF(): boolean {
        return this.pos >= this.length;
    }
}

/* ---------- Parser ---------- */

export type ASTNode = IdentifierNode | NumberNode | BinaryExpressionNode;

export interface IdentifierNode {
    type: "Identifier";
    name: string;
}
export interface NumberNode {
    type: "Number";
    value: number;
}
export interface BinaryExpressionNode {
    type: "BinaryExpression";
    operator: string;
    left: ASTNode;
    right: ASTNode;
}

/**
 * Recursive‑descent parser for arithmetic expressions using the token stream.
 * Grammar (left‑associative):
 *   Expr   ::= AddSub
 *   AddSub ::= MulDiv (('+'|'-') MulDiv)*
 *   MulDiv ::= Primary (('*'|'/') Primary)*
 *   Primary ::= Identifier | Number | '(' Expr ')'
 */
export class Parser {
    private readonly tokens: Token[];
    private pos: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    public parseExpression(): ASTNode {
        const node = this.parseAddSub();
        this.expect(TokenType.EOF);
        return node;
    }

    private parseAddSub(): ASTNode {
        let node = this.parseMulDiv();
        while (this.match(TokenType.Operator) && (this.current().value === "+" || this.current().value === "-")) {
            const op = this.consume().value;
            const right = this.parseMulDiv();
            node = { type: "BinaryExpression", operator: op, left: node, right };
        }
        return node;
    }

    private parseMulDiv(): ASTNode {
        let node = this.parsePrimary();
        while (this.match(TokenType.Operator) && (this.current().value === "*" || this.current().value === "/")) {
            const op = this.consume().value;
            const right = this.parsePrimary();
            node = { type: "BinaryExpression", operator: op, left: node, right };
        }
        return node;
    }

    private parsePrimary(): ASTNode {
        if (this.match(TokenType.Identifier)) {
            const name = this.consume().value;
            return { type: "Identifier", name };
        }
        if (this.match(TokenType.Number)) {
            const raw = this.consume().value;
            return { type: "Number", value: Number(raw) };
        }
        if (this.match(TokenType.LParen)) {
            this.consume(); // '('
            const expr = this.parseAddSub();
            this.expect(TokenType.RParen);
            this.consume(); // ')'
            return expr;
        }
        throw new Error(`Unexpected token ${this.current().type} at position ${this.current().start}`);
    }

    private current(): Token {
        return this.tokens[this.pos];
    }

    private match(type: TokenType): boolean {
        return this.current().type === type;
    }

    private consume(): Token {
        const tok = this.current();
        this.pos++;
        return tok;
    }

    private expect(type: TokenType): void {
        if (!this.match(type)) {
            throw new Error(`Expected token ${type} but found ${this.current().type} at position ${this.current().start}`);
        }
    }
}
);
