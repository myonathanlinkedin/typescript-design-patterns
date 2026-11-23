/**
 * Pratt Top-Down Operator Precedence Parser - Type Definitions
 *
 * This module defines the core data structures for a Pratt parser:
 * - Token: Lexical units produced by the tokenizer
 * - AST: Abstract Syntax Tree node types
 * - ParserState: Mutable parser state for the recursive descent engine
 *
 * Design invariants:
 * - All AST nodes are immutable (readonly properties)
 * - Token positions are 0-indexed character offsets
 * - Precedence levels are positive integers (higher = tighter binding)
 */

// ─── Token Types ─────────────────────────────────────────────────────────────

/** Discriminant for lexical tokens */
export enum TokenType {
  Number = "Number",
  Identifier = "Identifier",
  Plus = "Plus",
  Minus = "Minus",
  Star = "Star",
  Slash = "Slash",
  Percent = "Percent",
  Caret = "Caret",
  LParen = "LParen",
  RParen = "RParen",
  Comma = "Comma",
  Assign = "Assign",
  Eq = "Eq",
  Neq = "Neq",
  Lt = "Lt",
  Gt = "Gt",
  LtEq = "LtEq",
  GtEq = "GtEq",
  And = "And",
  Or = "Or",
  Not = "Not",
  EOF = "EOF",
}

/** A single lexical token with source position */
export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
  readonly line: number;
  readonly column: number;
}

// ─── AST Node Types ──────────────────────────────────────────────────────────

/** Base interface for all AST nodes */
export interface AstNode {
  readonly kind: string;
  readonly position: number;
}

/** Numeric literal node */
export interface NumberLiteral extends AstNode {
  readonly kind: "NumberLiteral";
  readonly value: number;
}

/** String literal node */
export interface StringLiteral extends AstNode {
  readonly kind: "StringLiteral";
  readonly value: string;
}

/** Boolean literal node */
export interface BooleanLiteral extends AstNode {
  readonly kind: "BooleanLiteral";
  readonly value: boolean;
}

/** Identifier reference node */
export interface IdentifierNode extends AstNode {
  readonly kind: "Identifier";
  readonly name: string;
}

/** Unary expression: -x, !x, +x */
export interface UnaryExpression extends AstNode {
  readonly kind: "UnaryExpression";
  readonly operator: string;
  readonly operand: AstNode;
}

/** Binary expression: a + b, a * b, a == b, etc. */
export interface BinaryExpression extends AstNode {
  readonly kind: "BinaryExpression";
  readonly operator: string;
  readonly left: AstNode;
  readonly right: AstNode;
}

/** Logical expression: a && b, a || b */
export interface LogicalExpression extends AstNode {
  readonly kind: "LogicalExpression";
  readonly operator: string;
  readonly left: AstNode;
  readonly right: AstNode;
}

/** Assignment expression: x = expr, x += expr */
export interface AssignmentExpression extends AstNode {
  readonly kind: "AssignmentExpression";
  readonly operator: string;
  readonly target: IdentifierNode;
  readonly value: AstNode;
}

/** Function call: f(a, b, c) */
export interface CallExpression extends AstNode {
  readonly kind: "CallExpression";
  readonly callee: AstNode;
  readonly arguments: AstNode[];
}

/** Member access: obj.prop */
export interface MemberExpression extends AstNode {
  readonly kind: "MemberExpression";
  readonly object: AstNode;
  readonly property: string;
}

/** Index access: arr[i] */
export interface IndexExpression extends AstNode {
  readonly kind: "IndexExpression";
  readonly object: AstNode;
  readonly index: AstNode;
}

/** Ternary conditional: cond ? a : b */
export interface ConditionalExpression extends AstNode {
  readonly kind: "ConditionalExpression";
  readonly test: AstNode;
  readonly consequent: AstNode;
  readonly alternate: AstNode;
}

/** Grouping: (expr) */
export interface GroupExpression extends AstNode {
  readonly kind: "GroupExpression";
  readonly expression: AstNode;
}

/** Array literal: [a, b, c] */
export interface ArrayLiteral extends AstNode {
  readonly kind: "ArrayLiteral";
  readonly elements: AstNode[];
}

/** Object literal: { key: value } */
export interface ObjectLiteral extends AstNode {
  readonly kind: "ObjectLiteral";
  readonly properties: { key: string; value: AstNode }[];
}

/** Union type for all AST nodes */
export type Ast =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | IdentifierNode
  | UnaryExpression
  | BinaryExpression
  | LogicalExpression
  | AssignmentExpression
  | CallExpression
  | MemberExpression
  | IndexExpression
  | ConditionalExpression
  | GroupExpression
  | ArrayLiteral
  | ObjectLiteral;

// ─── Parser State ────────────────────────────────────────────────────────────

/**
 * Mutable parser state passed through the recursive descent.
 * Encapsulates the token stream and current position.
 */
export interface ParserState {
  tokens: readonly Token[];
  position: number;
}

/**
 * Precedence level for an operator.
 * Higher values bind tighter.
 *
 * Precedence table (low to high):
 *   1: ||
 *   2: &&
 *   3: ==, !=
 *   4: <, >, <=, >=
 *   5: +, -
 *   6: *, /, %
 *   7: ^ (right-associative)
 *   8: unary -, !, +
 *   9: postfix (call, member, index)
 */
export type Precedence = number;

/**
 * Operator precedence map: token type -> { precedence, associativity }
 */
export interface OperatorInfo {
  readonly precedence: Precedence;
  readonly associativity: "left" | "right";
}

/**
 * Result of a successful parse
 */
export interface ParseResult {
  readonly success: true;
  readonly ast: Ast;
  readonly tokens: readonly Token[];
}

/**
 * Result of a failed parse
 */
export interface ParseError {
  readonly success: false;
  readonly error: string;
  readonly position: number;
  readonly line: number;
  readonly column: number;
}

/** Discriminated union for parse outcomes */
export type ParseOutcome = ParseResult | ParseError;

/**
 * Tokenizer result
 */
export interface TokenizeResult {
  readonly success: true;
  readonly tokens: readonly Token[];
}

export interface TokenizeError {
  readonly success: false;
  readonly error: string;
  readonly position: number;
  readonly line: number;
  readonly column: number;
}

export type TokenizeOutcome = TokenizeResult | TokenizeError;

// ─── AST Visitor ─────────────────────────────────────────────────────────────

/**
 * Visitor interface for AST traversal.
 * Enables pattern matching over AST nodes without mutation.
 */
export interface AstVisitor {
  visitNumberLiteral(node: NumberLiteral): void;
  visitStringLiteral(node: StringLiteral): void;
  visitBooleanLiteral(node: BooleanLiteral): void;
  visitIdentifier(node: IdentifierNode): void;
  visitUnaryExpression(node: UnaryExpression): void;
  visitBinaryExpression(node: BinaryExpression): void;
  visitLogicalExpression(node: LogicalExpression): void;
  visitAssignmentExpression(node: AssignmentExpression): void;
  visitCallExpression(node: CallExpression): void;
  visitMemberExpression(node: MemberExpression): void;
  visitIndexExpression(node: IndexExpression): void;
  visitConditionalExpression(node: ConditionalExpression): void;
  visitGroupExpression(node: GroupExpression): void;
  visitArrayLiteral(node: ArrayLiteral): void;
  visitObjectLiteral(node: ObjectLiteral): void;
}

/**
 * Default visitor that performs a depth-first traversal and collects node kinds.
 */
export class NodeCollector implements AstVisitor {
  public readonly nodes: string[] = [];

  visitNumberLiteral(node: NumberLiteral): void {
    this.nodes.push(`NumberLiteral(${node.value})`);
  }
  visitStringLiteral(node: StringLiteral): void {
    this.nodes.push(`StringLiteral(${JSON.stringify(node.value)})`);
  }
  visitBooleanLiteral(node: BooleanLiteral): void {
    this.nodes.push(`BooleanLiteral(${node.value})`);
  }
  visitIdentifier(node: IdentifierNode): void {
    this.nodes.push(`Identifier(${node.name})`);
  }
  visitUnaryExpression(node: UnaryExpression): void {
    this.nodes.push(`Unary(${node.operator})`);
  }
  visitBinaryExpression(node: BinaryExpression): void {
    this.nodes.push(`Binary(${node.operator})`);
  }
  visitLogicalExpression(node: LogicalExpression): void {
    this.nodes.push(`Logical(${node.operator})`);
  }
  visitAssignmentExpression(node: AssignmentExpression): void {
    this.nodes.push(`Assign(${node.operator})`);
  }
  visitCallExpression(node: CallExpression): void {
    this.nodes.push(`Call(${node.arguments.length} args)`);
  }
  visitMemberExpression(node: MemberExpression): void {
    this.nodes.push(`Member(.${node.property})`);
  }
  visitIndexExpression(node: IndexExpression): void {
    this.nodes.push(`Index[]`);
  }
  visitConditionalExpression(node: ConditionalExpression): void {
    this.nodes.push(`Conditional`);
  }
  visitGroupExpression(node: GroupExpression): void {
    this.nodes.push(`Group`);
  }
  visitArrayLiteral(node: ArrayLiteral): void {
    this.nodes.push(`Array(${node.elements.length})`);
  }
  visitObjectLiteral(node: ObjectLiteral): void {
    this.nodes.push(`Object(${node.properties.length})`);
  }
}

/**
 * Dispatch a visitor over an AST node.
 */
export function accept(node: Ast, visitor: AstVisitor): void {
  switch (node.kind) {
    case "NumberLiteral":
      visitor.visitNumberLiteral(node);
      break;
    case "StringLiteral":
      visitor.visitStringLiteral(node);
      break;
    case "BooleanLiteral":
      visitor.visitBooleanLiteral(node);
      break;
    case "Identifier":
      visitor.visitIdentifier(node);
      break;
    case "UnaryExpression":
      visitor.visitUnaryExpression(node);
      break;
    case "BinaryExpression":
      visitor.visitBinaryExpression(node);
      break;
    case "LogicalExpression":
      visitor.visitLogicalExpression(node);
      break;
    case "AssignmentExpression":
      visitor.visitAssignmentExpression(node);
      break;
    case "CallExpression":
      visitor.visitCallExpression(node);
      break;
    case "MemberExpression":
      visitor.visitMemberExpression(node);
      break;
    case "IndexExpression":
      visitor.visitIndexExpression(node);
      break;
    case "ConditionalExpression":
      visitor.visitConditionalExpression(node);
      break;
    case "GroupExpression":
      visitor.visitGroupExpression(node);
      break;
    case "ArrayLiteral":
      visitor.visitArrayLiteral(node);
      break;
    case "ObjectLiteral":
      visitor.visitObjectLiteral(node);
      break;
    default:
      const _exhaustive: never = node;
      throw new Error(`Unknown AST node kind: ${(_exhaustive as Ast).kind}`);
  }
}
