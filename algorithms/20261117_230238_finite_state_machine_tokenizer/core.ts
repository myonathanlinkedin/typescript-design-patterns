export enum TokenType {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    LeftParen = "LeftParen",
    RightParen = "RightParen",
    Whitespace = "Whitespace",
    EOF = "EOF",
    Unknown = "Unknown"
}

export interface Token {
    type: TokenType;
    value: string;
    start: number; // inclusive
    end: number;   // exclusive
}

enum State {
    Start,
    Identifier,
    Number,
    Operator,
    Whitespace,
    Done,
    Error
}

/**
 * Finite‑state machine based tokenizer.
 * Recognises identifiers ([a‑zA‑Z_][a‑zA‑Z0‑9_]*),
 * decimal numbers (integer and fractional, e.g. 123, 45.67),
 * operators (+ - * / ^ =),
 * parentheses, and whitespace.
 */
export class Tokenizer {
    private readonly operators = new Set<string>(['+', '-', '*', '/', '^', '=', ',']);
    private readonly isAlpha = (c: string) => /^[A-Za-z_]$/.test(c);
    private readonly isDigit = (c: string) => /^[0-9]$/.test(c);
    private readonly isAlnum = (c: string) => /^[A-Za-z0-9_]$/.test(c);
    private readonly isWhitespace = (c: string) => /^\s$/.test(c);
    private readonly isOperatorChar = (c: string) => this.operators.has(c);

    public tokenize(input: string): Token[] {
        const tokens: Token[] = [];
        let state: State = State.Start;
        let buffer = "";
        let tokenStart = 0;

        const flush = (type: TokenType, endPos: number) => {
            if (type !== TokenType.Whitespace) {
                tokens.push({ type, value: buffer, start: tokenStart, end: endPos });
            }
            buffer = "";
        };

        for (let i = 0; i <= input.length; i++) {
            const ch = i < input.length ? input[i] : "\0"; // sentinel
            switch (state) {
                case State.Start:
                    tokenStart = i;
                    if (this.isAlpha(ch)) {
                        state = State.Identifier;
                        buffer += ch;
                    } else if (this.isDigit(ch)) {
                        state = State.Number;
                        buffer += ch;
                    } else if (this.isOperatorChar(ch)) {
                        state = State.Operator;
                        buffer += ch;
                    } else if (ch === '(') {
                        tokens.push({ type: TokenType.LeftParen, value: ch, start: i, end: i + 1 });
                    } else if (ch === ')') {
                        tokens.push({ type: TokenType.RightParen, value: ch, start: i, end: i + 1 });
                    } else if (this.isWhitespace(ch)) {
                        state = State.Whitespace;
                        buffer += ch;
                    } else if (ch === "\0") {
                        tokens.push({ type: TokenType.EOF, value: "", start: i, end: i });
                    } else {
                        state = State.Error;
                        buffer += ch;
                    }
                    break;

                case State.Identifier:
                    if (this.isAlnum(ch)) {
                        buffer += ch;
                    } else {
                        flush(TokenType.Identifier, i);
                        state = State.Start;
                        i--; // reprocess current char
                    }
                    break;

                case State.Number:
                    if (this.isDigit(ch)) {
                        buffer += ch;
                    } else if (ch === '.' && !buffer.includes('.')) {
                        buffer += ch;
                    } else {
                        flush(TokenType.Number, i);
                        state = State.Start;
                        i--;
                    }
                    break;

                case State.Operator:
                    // Operators are single‑character in this simple lexer
                    flush(TokenType.Operator, i);
                    state = State.Start;
                    i--;
                    break;

                case State.Whitespace:
                    if (this.isWhitespace(ch)) {
                        buffer += ch;
                    } else {
                        flush(TokenType.Whitespace, i);
                        state = State.Start;
                        i--;
                    }
                    break;

                case State.Error:
                    // Consume until next whitespace or known delimiter
                    if (this.isWhitespace(ch) || ch === '(' || ch === ')' || this.isOperatorChar(ch) || ch === "\0") {
                        flush(TokenType.Unknown, i);
                        state = State.Start;
                        i--;
                    } else {
                        buffer += ch;
                    }
                    break;
            }
        }

        // Ensure EOF token is present
        if (tokens.length === 0 || tokens[tokens.length - 1].type !== TokenType.EOF) {
            tokens.push({ type: TokenType.EOF, value: "", start: input.length, end: input.length });
        }

        return tokens;
    }
}

/**
 * Simple recursive‑descent parser for arithmetic expressions.
 * Grammar:
 *   Expr   ::= Term (('+' | '-') Term)*
 *   Term   ::= Factor (('*' | '/' ) Factor)*
 *   Factor ::= Number | Identifier | '(' Expr ')'
 */
export type ASTNode = 
    | { type: "NumberLiteral"; value: number }
    | { type: "Identifier"; name: string }
    | { type: "BinaryExpression"; operator: string; left: ASTNode; right: ASTNode }
    | { type: "ParenExpression"; expression: ASTNode };

export class Parser {
    private tokens: Token[];
    private pos: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(): Token {
        return this.tokens[this.pos];
    }

    private consume(): Token {
        const tok = this.tokens[this.pos];
        this.pos++;
        return tok;
    }

    private expect(type: TokenType, value?: string): Token {
        const tok = this.peek();
        if (tok.type !== type || (value !== undefined && tok.value !== value)) {
            throw new SyntaxError(`Expected ${type}${value ? ` '${value}'` : ""} at position ${tok.start}`);
        }
        return this.consume();
    }

    public parseExpression(): ASTNode {
        return this.parseExpr();
    }

    private parseExpr(): ASTNode {
        let node = this.parseTerm();
        while (true) {
            const tok = this.peek();
            if (tok.type === TokenType.Operator && (tok.value === '+' || tok.value === '-')) {
                this.consume();
                const right = this.parseTerm();
                node = { type: "BinaryExpression", operator: tok.value, left: node, right };
            } else {
                break;
            }
        }
        return node;
    }

    private parseTerm(): ASTNode {
        let node = this.parseFactor();
        while (true) {
            const tok = this.peek();
            if (tok.type === TokenType.Operator && (tok.value === '*' || tok.value === '/')) {
                this.consume();
                const right = this.parseFactor();
                node = { type: "BinaryExpression", operator: tok.value, left: node, right };
            } else {
                break;
            }
        }
        return node;
    }

    private parseFactor(): ASTNode {
        const tok = this.peek();
        if (tok.type === TokenType.Number) {
            this.consume();
            return { type: "NumberLiteral", value: parseFloat(tok.value) };
        }
        if (tok.type === TokenType.Identifier) {
            this.consume();
            return { type: "Identifier", name: tok.value };
        }
        if (tok.type === TokenType.LeftParen) {
            this.consume();
            const expr = this.parseExpr();
            this.expect(TokenType.RightParen);
            return { type: "ParenExpression", expression: expr };
        }
        throw new SyntaxError(`Unexpected token '${tok.value}' at position ${tok.start}`);
    }
}
