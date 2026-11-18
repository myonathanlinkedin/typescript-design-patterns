export enum TokenType {
  Identifier,
  Number,
  String,
  Operator,
  LeftParen,
  RightParen,
  Whitespace,
  EOF,
  Unknown,
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

export interface IdentifierNode {
  type: 'Identifier';
  name: string;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export type ASTNode = NumberLiteral | IdentifierNode | BinaryExpression;

export class ParserError extends Error {
  constructor(message: string, public position: number) {
    super(message);
    this.name = 'ParserError';
  }
}
