import { Token, TokenType, CharClass, State } from "./types";

/**
 * A pure, deterministic finite‑state machine based lexical analyzer.
 *
 * Supported lexical grammar:
 *   - Identifier : /[A-Za-z][A-Za-z0-9]*/
 *   - Number     : /[0-9]+/
 *   - Operator   : one of + - * /
 *   - LeftParen  : '('
 *   - RightParen : ')'
 *   - Whitespace : space, tab, carriage‑return, line‑feed (ignored)
 *
 * Any character outside the above set causes a lexical error.
 */
export class Lexer {
    private readonly input: string;
    private pos: number = 0;               // current read position
    private readonly length: number;
    private tokens: Token[] = [];

    constructor(source: string) {
        this.input = source;
        this.length = source.length;
    }

    /** Public entry point – returns the full token stream including EOF */
    public tokenize(): Token[] {
        this.tokens = [];
        this.pos = 0;
        let state: State = State.Start;
        let tokenStart = 0;
        let buffer = "";

        while (state !== State.Done) {
            const ch = this.peek();
            const cls = this.classify(ch);

            switch (state) {
                case State.Start:
                    if (cls === CharClass.Whitespace) {
                        this.consume(); // skip
                    } else if (cls === CharClass.Letter) {
                        tokenStart = this.pos;
                        buffer = this.consume();
                        state = State.InIdentifier;
                    } else if (cls === CharClass.Digit) {
                        tokenStart = this.pos;
                        buffer = this.consume();
                        state = State.InNumber;
                    } else if (cls === CharClass.Operator) {
                        tokenStart = this.pos;
                        buffer = this.consume();
                        this.emitToken(TokenType.Operator, buffer, tokenStart);
                    } else if (cls === CharClass.LeftParen) {
                        tokenStart = this.pos;
                        buffer = this.consume();
                        this.emitToken(TokenType.LeftParen, buffer, tokenStart);
                    } else if (cls === CharClass.RightParen) {
                        tokenStart = this.pos;
                        buffer = this.consume();
                        this.emitToken(TokenType.RightParen, buffer, tokenStart);
                    } else if (cls === CharClass.Unknown && this.isEOF()) {
                        // End of input reached
                        this.emitToken(TokenType.EOF, "", this.pos);
                        state = State.Done;
                    } else {
                        // Unknown character – lexical error
                        const errPos = this.pos;
                        const offending = this.consume();
                        throw new Error(`Lexical error at position ${errPos}: unexpected character '${offending}'`);
                    }
                    break;

                case State.InIdentifier:
                    if (cls === CharClass.Letter || cls === CharClass.Digit) {
                        buffer += this.consume();
                    } else {
                        this.emitToken(TokenType.Identifier, buffer, tokenStart);
                        state = State.Start;
                    }
                    break;

                case State.InNumber:
                    if (cls === CharClass.Digit) {
                        buffer += this.consume();
                    } else {
                        this.emitToken(TokenType.Number, buffer, tokenStart);
                        state = State.Start;
                    }
                    break;

                default:
                    // Should never reach here
                    throw new Error(`Invalid lexer state ${state}`);
            }
        }

        return this.tokens;
    }

    /** Returns the next character without consuming it; returns empty string at EOF */
    private peek(): string {
        return this.pos < this.length ? this.input[this.pos] : "";
    }

    /** Consumes the current character and advances the cursor */
    private consume(): string {
        const ch = this.input[this.pos];
        this.pos += 1;
        return ch;
    }

    /** Determines whether the cursor has reached the end of the source */
    private isEOF(): boolean {
        return this.pos >= this.length;
    }

    /** Maps a character to its lexical class */
    private classify(ch: string): CharClass {
        if (ch === "") {
            return CharClass.Unknown;
        }
        const code = ch.charCodeAt(0);
        if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
            return CharClass.Letter;
        }
        if (code >= 48 && code <= 57) {
            return CharClass.Digit;
        }
        if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
            return CharClass.Whitespace;
        }
        if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
            return CharClass.Operator;
        }
        if (ch === "(") {
            return CharClass.LeftParen;
        }
        if (ch === ")") {
            return CharClass.RightParen;
        }
        return CharClass.Unknown;
    }

    /** Emits a token and stores it in the internal token array */
    private emitToken(type: TokenType, lexeme: string, position: number): void {
        this.tokens.push({ type, lexeme, position });
    }
}
