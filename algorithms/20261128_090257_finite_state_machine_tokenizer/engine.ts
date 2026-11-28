import { Token, TokenType, ASTNode, NumberLiteral, IdentifierNode, BinaryExpression } from './types';

export class Lexer {
  private input: string;
  private pos: number = 0;
  private currentChar: string | null = null;

  constructor(input: string) {
    this.input = input;
    this.advance();
  }

  private advance(): void {
    if (this.pos < this.input.length) {
      this.currentChar = this.input[this.pos];
      this.pos++;
    } else {
      this.currentChar = null;
    }
  }

  nextToken(): Token {
    while (this.currentChar !== null) {
      const ch = this.currentChar;
      const startPos = this.pos - 1;

      if (/\s/.test(ch)) {
        let value = '';
        while (this.currentChar !== null && /\s/.test(this.currentChar)) {
          value += this.currentChar;
          this.advance();
        }
        return { type: TokenType.Whitespace, value, position: startPos };
      }

      if (/[0-9]/.test(ch)) {
        let value = '';
        while (this.currentChar !== null && /[0-9]/.test(this.currentChar)) {
          value += this.currentChar;
          this.advance();
        }
        if (this.currentChar === '.') {
          value += '.';
          this.advance();
          if (this.currentChar !== null && /[0-9]/.test(this.currentChar)) {
            while (this.currentChar !== null && /[0-9]/.test(this.currentChar)) {
              value += this.currentChar;
              this.advance();
            }
          } else {
            this.pos--;
            this.currentChar = '.';
            return { type: TokenType.Number, value, position: startPos };
          }
        }
        return { type: TokenType.Number, value, position: startPos };
      }

      if (/[a-zA-Z_]/.test(ch)) {
        let value = '';
        while (this.currentChar !== null && /[a-zA-Z0-9_]/.test(this.currentChar)) {
          value += this.currentChar;
          this.advance();
        }
        return { type: TokenType.Identifier, value, position: startPos };
      }

      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
        this.advance();
        return { type: TokenType.Operator, value: ch, position: startPos };
      }

      if (ch === '(') {
        this.advance();
        return { type: TokenType.LeftParen, value: ch, position: startPos };
      }

      if (ch === ')') {
        this.advance();
        return { type: TokenType.RightParen, value: ch, position: startPos };
      }

      this.advance();
      return { type: TokenType.Unknown, value: ch, position: startPos };
    }

    return { type: TokenType.EOF, value: '', position: this.pos };
  }
}

export class Parser {
  private lexer: Lexer;
  private currentToken: Token;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.nextToken();
  }

  private eat(type: TokenType): void {
    if (this.currentToken.type === type) {
      this.currentToken = this.lexer.nextToken();
    } else {
      throw new Error(`Unexpected token at position ${this.currentToken.position}: expected ${TokenType[type]}, got ${TokenType[this.currentToken.type]}`);
    }
  }

  private skipWhitespace(): void {
    while (this.currentToken.type === TokenType.Whitespace) {
      this.currentToken = this.lexer.nextToken();
    }
  }

  parse(): ASTNode {
    this.skipWhitespace();
    const node = this.parseExpression();
    this.skipWhitespace();
    if (this.currentToken.type !== TokenType.EOF) {
      throw new Error(`Unexpected token after expression at position ${this.currentToken.position}`);
    }
    return node;
  }

  private parseExpression(): ASTNode {
    let node = this.parseTerm();
    this.skipWhitespace();
    while (this.currentToken.type === TokenType.Operator &&
           (this.currentToken.value === '+' || this.currentToken.value === '-')) {
      const op = this.currentToken.value;
      this.eat(TokenType.Operator);
      const right = this.parseTerm();
      node = { type: 'BinaryExpression', operator: op, left: node, right };
    }
    return node;
  }

  private parseTerm(): ASTNode {
    let node = this.parseFactor();
    this.skipWhitespace();
    while (this.currentToken.type === TokenType.Operator &&
           (this.currentToken.value === '*' || this.currentToken.value === '/')) {
      const op = this.currentToken.value;
      this.eat(TokenType.Operator);
      const right = this.parseFactor();
      node = { type: 'BinaryExpression', operator: op, left: node, right };
    }
    return node;
  }

  private parseFactor(): ASTNode {
    this.skipWhitespace();
    const token = this.currentToken;
    if (token.type === TokenType.Number) {
      this.eat(TokenType.Number);
      return { type: 'NumberLiteral', value: parseFloat(token.value) };
    }
    if (token.type === TokenType.Identifier) {
      this.eat(TokenType.Identifier);
      return { type: 'Identifier', name: token.value };
    }
    if (token.type === TokenType.LeftParen) {
      this.eat(TokenType.LeftParen);
      const node = this.parseExpression();
      this.skipWhitespace();
      if (this.currentToken.type !== TokenType.RightParen) {
        throw new Error(`Expected ')' at position ${this.currentToken.position}`);
      }
      this.eat(TokenType.RightParen);
      return node;
    }
    throw new Error(`Unexpected token at position ${token.position}`);
  }
}
