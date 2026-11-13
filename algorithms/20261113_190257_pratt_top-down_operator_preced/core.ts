export enum TokenType {
  Number,
  Plus,
  Minus,
  Star,
  Slash,
  LParen,
  RParen,
  EOF,
}

export interface Token {
  type: TokenType;
  text: string;
}

export class Lexer {
  private pos = 0;
  constructor(private readonly input: string) {}

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  nextToken(): Token {
    this.skipWhitespace();
    if (this.pos >= this.input.length) {
      return { type: TokenType.EOF, text: '' };
    }
    const ch = this.input[this.pos];
    if (this.isDigit(ch)) {
      let start = this.pos;
      while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
        this.pos++;
      }
      const text = this.input.slice(start, this.pos);
      return { type: TokenType.Number, text };
    }
    this.pos++;
    switch (ch) {
      case '+':
        return { type: TokenType.Plus, text: ch };
      case '-':
        return { type: TokenType.Minus, text: ch };
      case '*':
        return { type: TokenType.Star, text: ch };
      case '/':
        return { type: TokenType.Slash, text: ch };
      case '(':
        return { type: TokenType.LParen, text: ch };
      case ')':
        return { type: TokenType.RParen, text: ch };
      default:
        throw new Error(`Unexpected character: ${ch}`);
    }
  }
}

export interface Expr {
  accept<T>(visitor: ExprVisitor<T>): T;
}

export interface ExprVisitor<T> {
  visitNumberLiteral(node: NumberLiteral): T;
  visitBinaryExpr(node: BinaryExpr): T;
  visitUnaryExpr(node: UnaryExpr): T;
}

export class NumberLiteral implements Expr {
  constructor(public readonly value: number) {}
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitNumberLiteral(this);
  }
}

export class BinaryExpr implements Expr {
  constructor(
    public readonly left: Expr,
    public readonly operator: Token,
    public readonly right: Expr
  ) {}
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinaryExpr(this);
  }
}

export class UnaryExpr implements Expr {
  constructor(public readonly operator: Token, public readonly operand: Expr) {}
  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitUnaryExpr(this);
  }
}

export class Parser {
  private token: Token;
  private readonly lexer: Lexer;

  constructor(input: string) {
    this.lexer = new Lexer(input);
    this.token = this.lexer.nextToken();
  }

  private consume(expected: TokenType): Token {
    if (this.token.type !== expected) {
      throw new Error(`Expected token type ${TokenType[expected]}, got ${TokenType[this.token.type]}`);
    }
    const current = this.token;
    this.token = this.lexer.nextToken();
    return current;
  }

  private getPrecedence(tok: Token): number {
    switch (tok.type) {
      case TokenType.Plus:
      case TokenType.Minus:
        return 10;
      case TokenType.Star:
      case TokenType.Slash:
        return 20;
      default:
        return 0;
    }
  }

  private parsePrimary(): Expr {
    switch (this.token.type) {
      case TokenType.Number:
        const num = Number(this.token.text);
        this.consume(TokenType.Number);
        return new NumberLiteral(num);
      case TokenType.LParen:
        this.consume(TokenType.LParen);
        const expr = this.parseExpression(0);
        this.consume(TokenType.RParen);
        return expr;
      case TokenType.Minus:
        const op = this.consume(TokenType.Minus);
        const operand = this.parseExpression(30); // unary precedence
        return new UnaryExpr(op, operand);
      default:
        throw new Error(`Unexpected token: ${TokenType[this.token.type]}`);
    }
  }

  parseExpression(minPrecedence: number): Expr {
    let left = this.parsePrimary();

    while (true) {
      const prec = this.getPrecedence(this.token);
      if (prec < minPrecedence) break;

      const op = this.token;
      this.consume(op.type);
      const right = this.parseExpression(prec + 1);
      left = new BinaryExpr(left, op, right);
    }

    return left;
  }

  parse(): Expr {
    const expr = this.parseExpression(0);
    if (this.token.type !== TokenType.EOF) {
      throw new Error('Unexpected input after expression');
    }
    return expr;
  }
}

export class Evaluator implements ExprVisitor<number> {
  visitNumberLiteral(node: NumberLiteral): number {
    return node.value;
  }
  visitBinaryExpr(node: BinaryExpr): number {
    const left = node.left.accept(this);
    const right = node.right.accept(this);
    switch (node.operator.type) {
      case TokenType.Plus:
        return left + right;
      case TokenType.Minus:
        return left - right;
      case TokenType.Star:
        return left * right;
      case TokenType.Slash:
        return left / right;
      default:
        throw new Error(`Unknown binary operator: ${TokenType[node.operator.type]}`);
    }
  }
  visitUnaryExpr(node: UnaryExpr): number {
    const val = node.operand.accept(this);
    switch (node.operator.type) {
      case TokenType.Minus:
        return -val;
      default:
        throw new Error(`Unknown unary operator: ${TokenType[node.operator.type]}`);
    }
  }
}
