export enum TokenType {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    LeftParen = "LeftParen",
    RightParen = "RightParen",
    EOF = "EOF",
    Unknown = "Unknown"
}

export interface Token {
    type: TokenType;
    lexeme: string;
    position: number; // start index in the source string
}

export enum State {
    Start = "Start",
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    Done = "Done",
    Error = "Error"
}
