export enum TokenType {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    Whitespace = "Whitespace",
    Unknown = "Unknown",
    EOF = "EOF"
}

export interface Token {
    type: TokenType;
    lexeme: string;
    start: number; // inclusive index in source string
    end: number;   // exclusive index in source string
}

export enum State {
    Start,
    Identifier,
    Number,
    Operator,
    Unknown,
    End
}
