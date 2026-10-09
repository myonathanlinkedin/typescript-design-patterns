export enum TokenType {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    LeftParen = "LeftParen",
    RightParen = "RightParen",
    EOF = "EOF"
}

export interface Token {
    /** The categorical type of the token */
    type: TokenType;
    /** Exact substring from the source */
    lexeme: string;
    /** Zero‑based index of the first character of the token in the source */
    position: number;
}

/** Classification of a single Unicode code unit for the lexer */
export enum CharClass {
    Letter,
    Digit,
    Whitespace,
    Operator,
    LeftParen,
    RightParen,
    Unknown
}

/** Minimal deterministic finite‑state machine states for the lexer */
export enum State {
    Start,
    InIdentifier,
    InNumber,
    Done
}
