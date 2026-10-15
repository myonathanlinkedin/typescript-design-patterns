export enum TokenType {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    Punctuation = "Punctuation",
    Whitespace = "Whitespace",
    Unknown = "Unknown"
}

export interface Token {
    type: TokenType;
    value: string;
    start: number; // inclusive
    end: number;   // exclusive
}

export class LexError extends Error {
    constructor(public position: number, message: string) {
        super(`LexError at ${position}: ${message}`);
        Object.setPrototypeOf(this, LexError.prototype);
    }
}

/** Finite‑state machine based lexer */
export class Lexer {
    /** Tokenize the whole input string */
    public tokenize(input: string): Token[] {
        const tokens: Token[] = [];
        let state = State.Start;
        let tokenStart = 0;
        const length = input.length;

        const flush = (end: number) => {
            const value = input.slice(tokenStart, end);
            const type = stateToTokenType(state);
            if (type !== TokenType.Whitespace) {
                tokens.push({ type, value, start: tokenStart, end });
            }
            tokenStart = end;
            state = State.Start;
        };

        for (let i = 0; i < length; i++) {
            const ch = input[i];
            const cat = charCategory(ch);
            const next = transition(state, cat);
            if (next === State.Error) {
                throw new LexError(i, `Unexpected character '${ch}'`);
            }
            if (next === State.Accept) {
                flush(i);
                i--; // re‑process current char as start of next token
                continue;
            }
            if (state === State.Start) tokenStart = i;
            state = next;
        }

        // handle trailing token
        if (state !== State.Start && state !== State.Accept) {
            flush(length);
        }

        return tokens;
    }
}

/** Internal FSM states */
enum State {
    Start,
    InIdentifier,
    InNumber,
    InOperator,
    InPunctuation,
    InWhitespace,
    Accept,
    Error
}

/** Map FSM state to resulting token type */
function stateToTokenType(state: State): TokenType {
    switch (state) {
        case State.InIdentifier: return TokenType.Identifier;
        case State.InNumber: return TokenType.Number;
        case State.InOperator: return TokenType.Operator;
        case State.InPunctuation: return TokenType.Punctuation;
        case State.InWhitespace: return TokenType.Whitespace;
        default: return TokenType.Unknown;
    }
}

/** Character categories used by the transition table */
enum CharCat {
    Letter,
    Digit,
    Operator,
    Punctuation,
    Whitespace,
    Other
}

/** Classify a single character */
function charCategory(ch: string): CharCat {
    if (isLetter(ch)) return CharCat.Letter;
    if (isDigit(ch)) return CharCat.Digit;
    if (isOperator(ch)) return CharCat.Operator;
    if (isPunctuation(ch)) return CharCat.Punctuation;
    if (isWhitespace(ch)) return CharCat.Whitespace;
    return CharCat.Other;
}

/** Transition table: current state × character category → next state */
function transition(state: State, cat: CharCat): State {
    switch (state) {
        case State.Start:
            switch (cat) {
                case CharCat.Letter: return State.InIdentifier;
                case CharCat.Digit: return State.InNumber;
                case CharCat.Operator: return State.InOperator;
                case CharCat.Punctuation: return State.InPunctuation;
                case CharCat.Whitespace: return State.InWhitespace;
                default: return State.Error;
            }
        case State.InIdentifier:
            return (cat === CharCat.Letter || cat === CharCat.Digit) ? State.InIdentifier : State.Accept;
        case State.InNumber:
            return (cat === CharCat.Digit) ? State.InNumber : State.Accept;
        case State.InOperator:
            // allow multi‑char operators like ==, !=, <=, >=, &&, ||
            return (cat === CharCat.Operator) ? State.InOperator : State.Accept;
        case State.InPunctuation:
            return State.Accept;
        case State.InWhitespace:
            return (cat === CharCat.Whitespace) ? State.InWhitespace : State.Accept;
        default:
            return State.Error;
    }
}

/** Helper predicates */
function isLetter(ch: string): boolean {
    const code = ch.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || ch === '_';
}
function isDigit(ch: string): boolean {
    const code = ch.charCodeAt(0);
    return code >= 48 && code <= 57;
}
function isOperator(ch: string): boolean {
    return "+-*/%=&|!<>^".includes(ch);
}
function isPunctuation(ch: string): boolean {
    return ".,;:(){}[]".includes(ch);
}
function isWhitespace(ch: string): boolean {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}
