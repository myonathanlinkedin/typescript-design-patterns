import { Token, TokenType, State } from "./types";

function isLetter(ch: string): boolean {
    return /^[A-Za-z]$/.test(ch);
}

function isDigit(ch: string): boolean {
    return /^[0-9]$/.test(ch);
}

function isWhitespace(ch: string): boolean {
    return /^\s$/.test(ch);
}

function isOperatorChar(ch: string): boolean {
    return /^[+\-*/=]$/.test(ch);
}

export class Lexer {
    private input: string;
    private length: number;
    private index: number;
    private tokens: Token[];
    private state: State;
    private buffer: string;
    private tokenStart: number;

    constructor(input: string) {
        this.input = input;
        this.length = input.length;
        this.index = 0;
        this.tokens = [];
        this.state = State.Start;
        this.buffer = "";
        this.tokenStart = 0;
    }

    public tokenize(): Token[] {
        while (this.state !== State.Done) {
            const ch = this.peek();
            switch (this.state) {
                case State.Start:
                    this.handleStart(ch);
                    break;
                case State.Identifier:
                    this.handleIdentifier(ch);
                    break;
                case State.Number:
                    this.handleNumber(ch);
                    break;
                case State.Operator:
                    this.handleOperator(ch);
                    break;
                case State.Error:
                    this.handleError(ch);
                    break;
                default:
                    // Should never reach here
                    this.transitionTo(State.Error);
                    break;
            }
        }
        // Append EOF token
        this.tokens.push({ type: TokenType.EOF, lexeme: "", position: this.length });
        return this.tokens;
    }

    private peek(): string | null {
        if (this.index >= this.length) {
            return null;
        }
        return this.input[this.index];
    }

    private advance(): string | null {
        const ch = this.peek();
        if (ch !== null) {
            this.index++;
        }
        return ch;
    }

    private transitionTo(newState: State): void {
        this.state = newState;
    }

    private emitToken(type: TokenType): void {
        this.tokens.push({
            type,
            lexeme: this.buffer,
            position: this.tokenStart
        });
        this.buffer = "";
    }

    private handleStart(ch: string | null): void {
        if (ch === null) {
            this.transitionTo(State.Done);
            return;
        }

        if (isWhitespace(ch)) {
            this.advance(); // skip whitespace
            return;
        }

        if (isLetter(ch)) {
            this.tokenStart = this.index;
            this.buffer += ch;
            this.advance();
            this.transitionTo(State.Identifier);
            return;
        }

        if (isDigit(ch)) {
            this.tokenStart = this.index;
            this.buffer += ch;
            this.advance();
            this.transitionTo(State.Number);
            return;
        }

        if (isOperatorChar(ch)) {
            this.tokenStart = this.index;
            this.buffer += ch;
            this.advance();
            this.transitionTo(State.Operator);
            return;
        }

        if (ch === "(") {
            this.tokens.push({
                type: TokenType.LeftParen,
                lexeme: "(",
                position: this.index
            });
            this.advance();
            return;
        }

        if (ch === ")") {
            this.tokens.push({
                type: TokenType.RightParen,
                lexeme: ")",
                position: this.index
            });
            this.advance();
            return;
        }

        // Unknown character
        this.tokenStart = this.index;
        this.buffer += ch!;
        this.advance();
        this.transitionTo(State.Error);
    }

    private handleIdentifier(ch: string | null): void {
        if (ch !== null && (isLetter(ch) || isDigit(ch) || ch === "_")) {
            this.buffer += ch;
            this.advance();
            return;
        }
        // Identifier terminated
        this.emitToken(TokenType.Identifier);
        this.transitionTo(State.Start);
    }

    private handleNumber(ch: string | null): void {
        if (ch !== null && isDigit(ch)) {
            this.buffer += ch;
            this.advance();
            return;
        }
        // Number terminated
        this.emitToken(TokenType.Number);
        this.transitionTo(State.Start);
    }

    private handleOperator(ch: string | null): void {
        // Operators are single-character in this simple lexer
        this.emitToken(TokenType.Operator);
        this.transitionTo(State.Start);
    }

    private handleError(ch: string | null): void {
        // Emit unknown token and continue
        this.emitToken(TokenType.Unknown);
        this.transitionTo(State.Start);
    }
}
