export enum TokenKind {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    LParen = "LParen",
    RParen = "RParen",
    EOF = "EOF"
}

export interface Token {
    kind: TokenKind;
    lexeme: string;
    position: number; // start index in source
}

// Helper character classification (pure functions)
function isLetter(ch: string): boolean {
    return /^[A-Za-z]$/.test(ch);
}
function isDigit(ch: string): boolean {
    return /^[0-9]$/.test(ch);
}
function isWhitespace(ch: string): boolean {
    return /^\s$/.test(ch);
}
function isOperator(ch: string): boolean {
    return /^[+\-*/]$/.test(ch);
}

// Finite State Machine based Tokenizer
export class Tokenizer {
    private readonly input: string;
    private pos: number = 0;
    private readonly length: number;

    constructor(source: string) {
        this.input = source;
        this.length = source.length;
    }

    private peek(offset: number = 0): string {
        const idx = this.pos + offset;
        return idx < this.length ? this.input.charAt(idx) : "\0";
    }

    private advance(step: number = 1): void {
        this.pos += step;
    }

    private isAtEnd(): boolean {
        return this.pos >= this.length;
    }

    public tokenize(): Token[] {
        const tokens: Token[] = [];
        while (!this.isAtEnd()) {
            const start = this.pos;
            const ch = this.peek();

            if (isWhitespace(ch)) {
                this.advance(); // skip whitespace
                continue;
            }

            if (isLetter(ch) || ch === "_") {
                // Identifier: letter (letter|digit|_)*
                while (isLetter(this.peek()) || isDigit(this.peek()) || this.peek() === "_") {
                    this.advance();
                }
                const lex = this.input.slice(start, this.pos);
                tokens.push({ kind: TokenKind.Identifier, lexeme: lex, position: start });
                continue;
            }

            if (isDigit(ch)) {
                // Number: digit+
                while (isDigit(this.peek())) {
                    this.advance();
                }
                const lex = this.input.slice(start, this.pos);
                tokens.push({ kind: TokenKind.Number, lexeme: lex, position: start });
                continue;
            }

            if (isOperator(ch)) {
                this.advance();
                tokens.push({ kind: TokenKind.Operator, lexeme: ch, position: start });
                continue;
            }

            if (ch === "(") {
                this.advance();
                tokens.push({ kind: TokenKind.LParen, lexeme: ch, position: start });
                continue;
            }

            if (ch === ")") {
                this.advance();
                tokens.push({ kind: TokenKind.RParen, lexeme: ch, position: start });
                continue;
            }

            // Unknown character
            throw new Error(`Unexpected character '${ch}' at position ${start}`);
        }

        tokens.push({ kind: TokenKind.EOF, lexeme: "", position: this.pos });
        return tokens;
    }
}
