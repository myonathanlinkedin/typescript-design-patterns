import { Token, TokenType, State } from "./types";

export class Lexer {
    private static isLetter(ch: string): boolean {
        return /^[A-Za-z]$/.test(ch);
    }

    private static isDigit(ch: string): boolean {
        return /^[0-9]$/.test(ch);
    }

    private static isUnderscore(ch: string): boolean {
        return ch === "_";
    }

    private static isOperator(ch: string): boolean {
        return /[+\-*/=<>!&|^%]$/.test(ch);
    }

    private static isWhitespace(ch: string): boolean {
        return /^[ \t\r\n]$/.test(ch);
    }

    /**
     * Tokenizes the given input string using a deterministic finite state machine.
     * @param input The source code to tokenize.
     * @returns An array of Token objects (excluding Whitespace tokens).
     */
    public tokenize(input: string): Token[] {
        const tokens: Token[] = [];
        let state: State = State.Start;
        let lexemeStart = 0;
        let buffer = "";
        let hasDot = false; // for number literals

        const flushToken = (type: TokenType, endPos: number) => {
            if (type !== TokenType.Whitespace) {
                tokens.push({
                    type,
                    lexeme: buffer,
                    start: lexemeStart,
                    end: endPos
                });
            }
            buffer = "";
            hasDot = false;
        };

        const emitAndReset = (type: TokenType, currentPos: number) => {
            flushToken(type, currentPos);
            state = State.Start;
        };

        const length = input.length;
        for (let i = 0; i <= length; i++) {
            const ch = i < length ? input[i] : "\0"; // sentinel at EOF
            switch (state) {
                case State.Start:
                    if (Lexer.isWhitespace(ch)) {
                        // Skip whitespace, but advance index.
                        continue;
                    } else if (Lexer.isLetter(ch) || Lexer.isUnderscore(ch)) {
                        state = State.Identifier;
                        lexemeStart = i;
                        buffer = ch;
                    } else if (Lexer.isDigit(ch)) {
                        state = State.Number;
                        lexemeStart = i;
                        buffer = ch;
                        hasDot = false;
                    } else if (Lexer.isOperator(ch)) {
                        state = State.Operator;
                        lexemeStart = i;
                        buffer = ch;
                    } else if (ch === "\0") {
                        // End of input
                        tokens.push({
                            type: TokenType.EOF,
                            lexeme: "",
                            start: i,
                            end: i
                        });
                        state = State.End;
                    } else {
                        state = State.Unknown;
                        lexemeStart = i;
                        buffer = ch;
                    }
                    break;

                case State.Identifier:
                    if (Lexer.isLetter(ch) || Lexer.isDigit(ch) || Lexer.isUnderscore(ch)) {
                        buffer += ch;
                    } else {
                        emitAndReset(TokenType.Identifier, i);
                        i--; // reprocess this character in Start state
                    }
                    break;

                case State.Number:
                    if (Lexer.isDigit(ch)) {
                        buffer += ch;
                    } else if (ch === "." && !hasDot) {
                        // Allow a single decimal point
                        hasDot = true;
                        buffer += ch;
                    } else {
                        emitAndReset(TokenType.Number, i);
                        i--;
                    }
                    break;

                case State.Operator:
                    // Operators are single-character for this lexer.
                    emitAndReset(TokenType.Operator, i);
                    i--;
                    break;

                case State.Unknown:
                    emitAndReset(TokenType.Unknown, i);
                    i--;
                    break;

                case State.End:
                    // No further processing.
                    break;
            }

            if (state === State.End) {
                break;
            }
        }

        return tokens;
    }
}
