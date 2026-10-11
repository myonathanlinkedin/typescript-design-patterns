import { Token, TokenType, CharClass, State } from "./types";

export class Lexer {
    private static isLetter(ch: string): boolean {
        return /^[A-Za-z]$/.test(ch);
    }

    private static isDigit(ch: string): boolean {
        return /^[0-9]$/.test(ch);
    }

    private static isWhitespace(ch: string): boolean {
        return /^\s$/.test(ch);
    }

    private static isOperator(ch: string): boolean {
        return /^[+\-*/]$/.test(ch);
    }

    private static isParen(ch: string): boolean {
        return /^[()]$/.test(ch);
    }

    private static classify(ch: string): CharClass {
        if (Lexer.isLetter(ch)) return CharClass.Letter;
        if (Lexer.isDigit(ch)) return CharClass.Digit;
        if (Lexer.isWhitespace(ch)) return CharClass.Whitespace;
        if (Lexer.isOperator(ch)) return CharClass.Operator;
        if (Lexer.isParen(ch)) return CharClass.Paren;
        return CharClass.Unknown;
    }

    /**
     * Tokenizes the given source string using a deterministic finite automaton.
     * @param source Input program text.
     * @returns Array of tokens ending with an EOF token.
     * @throws Error on encountering an unknown character.
     */
    public tokenize(source: string): Token[] {
        const tokens: Token[] = [];
        let state: State = State.Start;
        let buffer = "";
        let tokenStart = 0;

        const emitToken = (type: TokenType, lexeme: string, startPos: number) => {
            tokens.push({ type, lexeme, position: startPos });
        };

        const flushBuffer = (currentPos: number) => {
            if (state === State.InIdentifier) {
                emitToken(TokenType.Identifier, buffer, tokenStart);
            } else if (state === State.InNumber) {
                emitToken(TokenType.Number, buffer, tokenStart);
            }
            buffer = "";
            state = State.Start;
        };

        for (let i = 0; i <= source.length; i++) {
            const ch = i < source.length ? source[i] : "\0"; // sentinel
            const cls = i < source.length ? Lexer.classify(ch) : CharClass.Unknown;

            switch (state) {
                case State.Start:
                    if (i === source.length) {
                        // End of input
                        state = State.Done;
                    } else if (cls === CharClass.Whitespace) {
                        // Skip whitespace
                    } else if (cls === CharClass.Letter) {
                        state = State.InIdentifier;
                        buffer = ch;
                        tokenStart = i;
                    } else if (cls === CharClass.Digit) {
                        state = State.InNumber;
                        buffer = ch;
                        tokenStart = i;
                    } else if (cls === CharClass.Operator) {
                        emitToken(TokenType.Operator, ch, i);
                    } else if (cls === CharClass.Paren) {
                        if (ch === "(") {
                            emitToken(TokenType.LeftParen, ch, i);
                        } else {
                            emitToken(TokenType.RightParen, ch, i);
                        }
                    } else {
                        throw new Error(`Unrecognized character '${ch}' at position ${i}`);
                    }
                    break;

                case State.InIdentifier:
                    if (i === source.length) {
                        flushBuffer(i);
                        state = State.Done;
                    } else if (cls === CharClass.Letter || cls === CharClass.Digit) {
                        buffer += ch;
                    } else {
                        flushBuffer(i);
                        // Reprocess current character in Start state
                        i--; // will be incremented by loop
                    }
                    break;

                case State.InNumber:
                    if (i === source.length) {
                        flushBuffer(i);
                        state = State.Done;
                    } else if (cls === CharClass.Digit) {
                        buffer += ch;
                    } else {
                        flushBuffer(i);
                        i--; // reprocess
                    }
                    break;

                case State.Done:
                    // No further processing
                    break;

                case State.Error:
                    throw new Error(`Lexer entered error state at position ${i}`);
            }

            if (state === State.Done) {
                break;
            }
        }

        // Append EOF token
        emitToken(TokenType.EOF, "", source.length);
        return tokens;
    }
}
);
