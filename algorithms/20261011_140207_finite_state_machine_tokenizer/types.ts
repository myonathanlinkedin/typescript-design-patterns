export enum TokenType {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    LeftParen = "LeftParen",
    RightParen = "RightParen",
    EOF = "EOF"
}

export interface Token {
    type: TokenType;
    lexeme: string;
    position: number; // start index in the source string
}

export enum CharClass {
    Letter,
    Digit,
    Whitespace,
    Operator,
    Paren,
    Unknown
}

export enum State {
    Start,
    InIdentifier,
    InNumber,
    Done,
    Error
}
