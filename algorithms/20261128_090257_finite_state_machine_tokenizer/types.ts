export enum TokenType {
  Number,
  Identifier,
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

export type ASTNode = NumberLiteral | IdentifierNode | BinaryExpression;

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
