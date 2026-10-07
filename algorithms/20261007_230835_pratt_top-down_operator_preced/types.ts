export enum TokenType {
    Number,
    Operator,
    LeftParen,
    RightParen,
    EOF,
}

export interface Token {
    type: TokenType;
    value: string;
    pos: number;
}

export type ASTNode = NumberLiteral | PrefixExpression | BinaryExpression;

export interface NumberLiteral {
    type: "NumberLiteral";
    value: number;
}

export interface PrefixExpression {
    type: "PrefixExpression";
    operator: string;
    right: ASTNode;
}

export interface BinaryExpression {
    type: "BinaryExpression";
    operator: string;
    left: ASTNode;
    right: ASTNode;
}
