import { Token, TokenType, ParserError, ASTNode } from './types';

export class Tokenizer {
  private input: string;
  private pos: number;

  constructor(input: string) {
    this.input = input;
    this.pos = 0;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (/\s/.test(ch)) {
        this.consumeWhitespace();
        continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        tokens.push(this.consumeIdentifier());
        continue;
      }
      if (/[0-9]/.test(ch)) {
        tokens.push(this.consumeNumber());
        continue;
      }
      if (ch === '"' || ch === "'") {
        tokens.push(this.consumeString(ch));
        continue;
      }
      if (ch === '(') {
        tokens.push({ type: TokenType.LeftParen, value: ch, position: this.pos });
        this.pos++;
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: TokenType.RightParen, value: ch, position: this.pos });
        this.pos++;
        continue;
      }
      if (['+', '-', '*', '/', '=', '<', '>', '!'].includes(ch)) {
        tokens.push(this.consumeOperator());
        continue;
      }
      // Unknown character
      tokens.push({ type: TokenType.Unknown, value: ch, position: this.pos });
      this.pos++;
    }
    tokens.push({ type: TokenType.EOF, value: '', position: this.pos });
    return tokens;
  }

  private consumeWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private consumeIdentifier(): Token {
    const start = this.pos;
    while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
      this.pos++;
    }
    const value = this.input.slice(start, this.pos);
    return { type: TokenType.Identifier, value, position: start };
  }

  private consumeNumber(): Token {
    const start = this.pos;
    while (this.pos < this.input.length && /[0-9]/.test(this.input[this.pos])) {
      this.pos++;
    }
    const value = this.input.slice(start, this.pos);
    return { type: TokenType.Number, value, position: start };
  }

  private consumeString(quote: string): Token {
    const start = this.pos;
    this.pos++; // skip opening quote
    let value = '';
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === '\\') {
        this.pos++;
        if (this.pos < this.input.length) {
          value += this.input[this.pos];
          this.pos++;
        } else {
          break;
        }
      } else if (ch === quote) {
        this.pos++;
        break;
      } else {
        value += ch;
        this.pos++;
      }
    }
    return { type: TokenType.String, value, position: start };
  }

  private consumeOperator(): Token {
    const start = this.pos;
    let value = this.input[this.pos];
    this.pos++;
    if (this.pos < this.input.length) {
      const next = this.input[this.pos];
      if (
        (value === '=' && next === '=') ||
        (value === '!' && next === '=') ||
        (value === '<' && next === '=') ||
        (value === '>' && next === '=')
      ) {
        value += next;
        this.pos++;
      }
    }
    return { type: TokenType.Operator, value, position: start };
  }
}

export class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(expected?: TokenType): Token {
    const token = this.tokens[this.pos];
    if (expected !== undefined && token.type !== expected) {
      throw new ParserError(
        `Expected token type ${TokenType[expected]}, got ${TokenType[token.type]}`,
        token.position
      );
    }
    this.pos++;
    return token;
  }

  public parseExpression(): ASTNode {
    return this.parseAdditive();
  }

  private parseAdditive(): ASTNode {
    let node = this.parseMultiplicative();
    while (
      this.peek().type === TokenType.Operator &&
      ['+', '-'].includes(this.peek().value)
    ) {
      const opToken = this.consume(TokenType.Operator);
      const right = this.parseMultiplicative();
      node = {
        type: 'BinaryExpression',
        operator: opToken.value,
        left: node,
        right,
      };
    }
    return node;
  }

  private parseMultiplicative(): ASTNode {
    let node = this.parsePrimary();
    while (
      this.peek().type === TokenType.Operator &&
      ['*', '/'].includes(this.peek().value)
    ) {
      const opToken = this.consume(TokenType.Operator);
      const right = this.parsePrimary();
      node = {
        type: 'BinaryExpression',
        operator: opToken.value,
        left: node,
        right,
      };
    }
    return node;
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();
    if (token.type === TokenType.Number) {
      this.consume(TokenType.Number);
      return { type: 'NumberLiteral', value: Number(token.value) };
    }
    if (token.type === TokenType.Identifier) {
      this.consume(TokenType.Identifier);
      return { type: 'Identifier', name: token.value };
    }
    if (token.type === TokenType.LeftParen) {
      this.consume(TokenType.LeftParen);
      const expr = this.parseExpression();
      this.consume(TokenType.RightParen);
      return expr;
    }
    if (token.type === TokenType.Operator && token.value === '-') {
      this.consume(TokenType.Operator);
      const expr = this.parsePrimary();
      return {
        type: 'BinaryExpression',
        operator: '-',
        left: { type: 'NumberLiteral', value: 0 },
        right: expr,
      };
    }
    throw new ParserError(
      `Unexpected token ${TokenType[token.type]} (${token.value})`,
      token.position
    );
  }
}
