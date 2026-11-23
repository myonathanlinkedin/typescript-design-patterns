/**
 * Pratt Top-Down Operator Precedence Parser - Core Engine
 *
 * Implements:
 * 1. Tokenizer (lexer) with position tracking
 * 2. Pratt parser using the "nudge" (precedence climbing) technique
 * 3. AST printer for pretty-printing
 *
 * Time complexity: O(n) for tokenization, O(n) for parsing (each token visited once)
 * Space complexity: O(n) for token array, O(d) for recursion depth where d = nesting depth
 */

import {
  TokenType,
  Token,
  Ast,
  AstNode,
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  IdentifierNode,
  UnaryExpression,
  BinaryExpression,
  LogicalExpression,
  AssignmentExpression,
  CallExpression,
  MemberExpression,
  IndexExpression,
  ConditionalExpression,
  GroupExpression,
  ArrayLiteral,
  ObjectLiteral,
  ParserState,
  Precedence,
  OperatorInfo,
  ParseOutcome,
  TokenizeOutcome,
  AstVisitor,
  accept,
  NodeCollector,
} from "./types";

// ─── Tokenizer ───────────────────────────────────────────────────────────────

/**
 * Tokenize a source string into a flat array of tokens.
 *
 * Handles:
 * - Multi-character operators (==, !=, <=, >=, &&, ||, +=, -=, *=, /=, %=, **=)
 * - Single-character operators (+, -, *, /, %, ^, (, ), [, ], {, }, ., ,, =, !, <, >, ?, :)
 * - Numeric literals (integers and decimals)
 * - String literals (single and double quoted, with escape sequences)
 * - Identifiers (letters, digits, underscore, dollar sign)
 * - Whitespace skipping
 *
 * @param source - The input source code string
 * @returns TokenizeOutcome with tokens or error
 */
export function tokenize(source: string): TokenizeOutcome {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  const length = source.length;

  while (pos < length) {
    const ch = source[pos];

    // Skip whitespace
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      if (ch === "\n") {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
      continue;
    }

    const startLine = line;
    const startCol = col;
    const startPos = pos;

    // Multi-character operators (check before single-char)
    const twoChar = source.substring(pos, pos + 2);
    const threeChar = source.substring(pos, pos + 3);

    if (threeChar === "**=") {
      tokens.push(makeToken(TokenType.Assign, "**=", startPos, startLine, startCol));
      pos += 3;
      col += 3;
      continue;
    }

    if (twoChar === "==") {
      tokens.push(makeToken(TokenType.Eq, "==", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "!=") {
      tokens.push(makeToken(TokenType.Neq, "!=", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "<=") {
      tokens.push(makeToken(TokenType.LtEq, "<=", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === ">=") {
      tokens.push(makeToken(TokenType.GtEq, ">=", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "&&") {
      tokens.push(makeToken(TokenType.And, "&&", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "||") {
      tokens.push(makeToken(TokenType.Or, "||", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "+=") {
      tokens.push(makeToken(TokenType.Assign, "+=", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "-=") {
      tokens.push(makeToken(TokenType.Assign, "-=", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "*=") {
      tokens.push(makeToken(TokenType.Assign, "*=", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "/=") {
      tokens.push(makeToken(TokenType.Assign, "/=", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "%=") {
      tokens.push(makeToken(TokenType.Assign, "%=", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }
    if (twoChar === "**") {
      // Treat ** as exponentiation (same as ^)
      tokens.push(makeToken(TokenType.Caret, "**", startPos, startLine, startCol));
      pos += 2;
      col += 2;
      continue;
    }

    // Single-character operators
    switch (ch) {
      case "+":
        tokens.push(makeToken(TokenType.Plus, "+", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "-":
        tokens.push(makeToken(TokenType.Minus, "-", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "*":
        tokens.push(makeToken(TokenType.Star, "*", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "/":
        tokens.push(makeToken(TokenType.Slash, "/", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "%":
        tokens.push(makeToken(TokenType.Percent, "%", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "^":
        tokens.push(makeToken(TokenType.Caret, "^", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "(":
        tokens.push(makeToken(TokenType.LParen, "(", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case ")":
        tokens.push(makeToken(TokenType.RParen, ")", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "[":
        tokens.push(makeToken(TokenType.LParen, "[", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "]":
        tokens.push(makeToken(TokenType.RParen, "]", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "{":
        tokens.push(makeToken(TokenType.LParen, "{", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "}":
        tokens.push(makeToken(TokenType.RParen, "}", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case ".":
        tokens.push(makeToken(TokenType.Comma, ".", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case ",":
        tokens.push(makeToken(TokenType.Comma, ",", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "=":
        tokens.push(makeToken(TokenType.Assign, "=", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "!":
        tokens.push(makeToken(TokenType.Not, "!", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "<":
        tokens.push(makeToken(TokenType.Lt, "<", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case ">":
        tokens.push(makeToken(TokenType.Gt, ">", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case "?":
        tokens.push(makeToken(TokenType.Comma, "?", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
      case ":":
        tokens.push(makeToken(TokenType.Comma, ":", startPos, startLine, startCol));
        pos++;
        col++;
        continue;
    }

    // Numeric literals
    if (isDigit(ch)) {
      let numStr = "";
      let isFloat = false;
      while (pos < length && isDigit(source[pos])) {
        numStr += source[pos];
        pos++;
        col++;
      }
      if (pos < length && source[pos] === "." && isDigit(source[pos + 1])) {
        isFloat = true;
        numStr += ".";
        pos++;
        col++;
        while (pos < length && isDigit(source[pos])) {
          numStr += source[pos];
          pos++;
          col++;
        }
      }
      const numValue = isFloat ? parseFloat(numStr) : parseInt(numStr, 10);
      tokens.push({
        type: TokenType.Number,
        value: numStr,
        position: startPos,
        line: startLine,
        column: startCol,
      });
      continue;
    }

    // String literals
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let strVal = "";
      pos++;
      col++;
      let closed = false;
      while (pos < length) {
        const c = source[pos];
        if (c === "\\" && pos + 1 < length) {
          const next = source[pos + 1];
          switch (next) {
            case "n":
              strVal += "\n";
              break;
            case "t":
              strVal += "\t";
              break;
            case "r":
              strVal += "\r";
              break;
            case "\\":
              strVal += "\\";
              break;
            case "'":
              strVal += "'";
              break;
            case '"':
              strVal += '"';
              break;
            default:
              strVal += next;
              break;
          }
          pos += 2;
          col += 2;
          continue;
        }
        if (c === quote) {
          closed = true;
          pos++;
          col++;
          break;
        }
        if (c === "\n") {
          break; // Unterminated string
        }
        strVal += c;
        pos++;
        col++;
      }
      if (!closed) {
        return {
          success: false,
          error: "Unterminated string literal",
          position: startPos,
          line: startLine,
          column: startCol,
        };
      }
      tokens.push({
        type: TokenType.Identifier,
        value: strVal,
        position: startPos,
        line: startLine,
        column: startCol,
      });
      continue;
    }

    // Identifiers and keywords
    if (isIdentifierStart(ch)) {
      let ident = "";
      while (pos < length && isIdentifierPart(source[pos])) {
        ident += source[pos];
        pos++;
        col++;
      }
      tokens.push({
        type: TokenType.Identifier,
        value: ident,
        position: startPos,
        line: startLine,
        column: startCol,
      });
      continue;
    }

    // Unknown character
    return {
      success: false,
      error: `Unexpected character '${ch}'`,
      position: startPos,
      line: startLine,
      column: startCol,
    };
  }

  // Append EOF token
  tokens.push({
    type: TokenType.EOF,
    value: "",
    position: pos,
    line,
    column: col,
  });

  return { success: true, tokens };
}

function makeToken(
  type: TokenType,
  value: string,
  position: number,
  line: number,
  column: number
): Token {
  return { type, value, position, line, column };
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isIdentifierStart(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    ch === "_" ||
    ch === "$"
  );
}

function isIdentifierPart(ch: string): boolean {
  return isIdentifierStart(ch) || isDigit(ch);
}

// ─── Precedence Table ────────────────────────────────────────────────────────

/**
 * Operator precedence and associativity table.
 *
 * Precedence levels (higher = tighter binding):
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
const OPERATOR_PRECEDENCE: Map<TokenType, OperatorInfo> = new Map([
  [TokenType.Or, { precedence: 1, associativity: "left" }],
  [TokenType.And, { precedence: 2, associativity: "left" }],
  [TokenType.Eq, { precedence: 3, associativity: "left" }],
  [TokenType.Neq, { precedence: 3, associativity: "left" }],
  [TokenType.Lt, { precedence: 4, associativity: "left" }],
  [TokenType.Gt, { precedence: 4, associativity: "left" }],
  [TokenType.LtEq, { precedence: 4, associativity: "left" }],
  [TokenType.GtEq, { precedence: 4, associativity: "left" }],
  [TokenType.Plus, { precedence: 5, associativity: "left" }],
  [TokenType.Minus, { precedence: 5, associativity: "left" }],
  [TokenType.Star, { precedence: 6, associativity: "left" }],
  [TokenType.Slash, { precedence: 6, associativity: "left" }],
  [TokenType.Percent, { precedence: 6, associativity: "left" }],
  [TokenType.Caret, { precedence: 7, associativity: "right" }],
]);

/**
 * Get the precedence of a binary operator token.
 * Returns 0 if the token is not a binary operator.
 */
function getBinaryPrecedence(token: Token): Precedence {
  const info = OPERATOR_PRECEDENCE.get(token.type);
  return info ? info.precedence : 0;
}

/**
 * Get the associativity of a binary operator token.
 * Defaults to "left" if not found.
 */
function getAssociativity(token: Token): "left" | "right" {
  const info = OPERATOR_PRECEDENCE.get(token.type);
  return info ? info.associativity : "left";
}

/**
 * Check if a token is a valid binary operator.
 */
function isBinaryOperator(token: Token): boolean {
  return OPERATOR_PRECEDENCE.has(token.type);
}

/**
 * Check if a token is a valid unary operator (prefix).
 */
function isUnaryOperator(token: Token): boolean {
  return (
    token.type === TokenType.Minus ||
    token.type === TokenType.Plus ||
    token.type === TokenType.Not
  );
}

/**
 * Check if a token is a valid postfix operator.
 */
function isPostfixOperator(token: Token): boolean {
  return (
    token.type === TokenType.LParen || // function call
    token.type === TokenType.Comma && token.value === "." || // member access
    token.type === TokenType.LParen && token.value === "[" // index access
  );
}

// ─── Pratt Parser ────────────────────────────────────────────────────────────

/**
 * Pratt parser state.
 *
 * The parser uses a single mutable state object to track:
 * - The token stream
 * - Current token position
 * - Error state (if any)
 */
interface PrattParserState {
  tokens: readonly Token[];
  pos: number;
  error: string | null;
  errorPos: number;
  errorLine: number;
  errorCol: number;
}

/**
 * Parse a source string into an AST using the Pratt (top-down operator precedence) algorithm.
 *
 * The Pratt parser works by:
 * 1. Parsing a "nud" (null denotation) for the current token (prefix/atom)
 * 2. Repeatedly parsing "led" (left denotation) for binary operators with
 *    precedence >= the minimum precedence argument
 * 3. For right-associative operators, the minimum precedence is decremented
 *    by 1 to allow right-nesting
 *
 * @param source - The input source code string
 * @returns ParseOutcome with AST or error
 */
export function parse(source: string): ParseOutcome {
  const tokenizeResult = tokenize(source);
  if (!tokenizeResult.success) {
    return {
      success: false,
      error: tokenizeResult.error,
      position: tokenizeResult.position,
      line: tokenizeResult.line,
      column: tokenizeResult.column,
    };
  }

  const state: PrattParserState = {
    tokens: tokenizeResult.tokens,
    pos: 0,
    error: null,
    errorPos: 0,
    errorLine: 0,
    errorCol: 0,
  };

  const ast = parseExpression(state, 0);

  if (state.error !== null) {
    return {
      success: false,
      error: state.error,
      position: state.errorPos,
      line: state.errorLine,
      column: state.errorCol,
    };
  }

  // Ensure we consumed all tokens (except EOF)
  if (state.pos < state.tokens.length - 1) {
    const unexpected = state.tokens[state.pos];
    return {
      success: false,
      error: `Unexpected token '${unexpected.value}' at position ${unexpected.position}`,
      position: unexpected.position,
      line: unexpected.line,
      column: unexpected.column,
    };
  }

  return {
    success: true,
    ast,
    tokens: state.tokens,
  };
}

/**
 * Get the current token without advancing.
 */
function peek(state: PrattParserState): Token {
  return state.tokens[state.pos];
}

/**
 * Get the next token and advance the position.
 */
function advance(state: PrattParserState): Token {
  const token = state.tokens[state.pos];
  if (state.pos < state.tokens.length - 1) {
    state.pos++;
  }
  return token;
}

/**
 * Check if the current token matches the expected type.
 */
function check(state: PrattParserState, type: TokenType): boolean {
  return peek(state).type === type;
}

/**
 * Consume a token of the expected type, or set an error.
 */
function expect(state: PrattParserState, type: TokenType, context: string): Token {
  const token = peek(state);
  if (token.type !== type) {
    state.error = `Expected ${context} but found '${token.value}'`;
    state.errorPos = token.position;
    state.errorLine = token.line;
    state.errorCol = token.column;
    return token;
  }
  return advance(state);
}

/**
 * Parse an expression with the given minimum precedence.
 *
 * This is the core of the Pratt parser. The algorithm:
 * 1. Parse the left-hand side (nud)
 * 2. While the current token is a binary operator with precedence >= minPrec:
 *    a. Consume the operator
 *    b. Determine the right-hand side precedence based on associativity
 *    c. Recursively parse the right-hand side (led)
 *    d. Build a binary expression node
 *
 * @param state - Parser state
 * @param minPrec - Minimum precedence for binary operators to bind
 * @returns The parsed AST node
 */
function parseExpression(state: PrattParserState, minPrec: Precedence): Ast {
  // Step 1: Parse the left-hand side (nud - null denotation)
  let left = parseNud(state);

  // Step 2: Parse binary operators (led - left denotation)
  while (state.error === null) {
    const token = peek(state);

    // Stop if we hit EOF or a non-operator
    if (token.type === TokenType.EOF) {
      break;
    }

    // Check if this is a binary operator with sufficient precedence
    const prec = getBinaryPrecedence(token);
    if (prec === 0) {
      break;
    }

    if (prec < minPrec) {
      break;
    }

    // Consume the operator
    advance(state);

    // Determine the right-hand side precedence
    const associativity = getAssociativity(token);
    const rightMinPrec =
      associativity === "left" ? prec + 1 : prec;

    // Parse the right-hand side
    const right = parseExpression(state, rightMinPrec);

    // Build the binary expression
    const opStr = token.value;
    const isLogical =
      token.type === TokenType.And || token.type === TokenType.Or;

    if (isLogical) {
      left = {
        kind: "LogicalExpression",
        operator: opStr,
        left,
        right,
        position: token.position,
      };
    } else {
      left = {
        kind: "BinaryExpression",
        operator: opStr,
        left,
        right,
        position: token.position,
      };
    }
  }

  return left;
}

/**
 * Parse a "nud" (null denotation) - the leftmost/atomic part of an expression.
 *
 * Handles:
 * - Numeric literals
 * - String literals
 * - Boolean literals (true, false)
 * - Identifiers
 * - Unary operators (-, +, !)
 * - Grouped expressions (expr)
 * - Array literals [a, b, c]
 * - Object literals { key: value }
 *
 * @param state - Parser state
 * @returns The parsed AST node
 */
function parseNud(state: PrattParserState): Ast {
  const token = peek(state);

  // Numeric literal
  if (token.type === TokenType.Number) {
    advance(state);
    const value = parseFloat(token.value);
    return {
      kind: "NumberLiteral",
      value,
      position: token.position,
    };
  }

  // String literal (stored as Identifier token with string value)
  // We detect strings by checking if the original source had quotes.
  // For simplicity, we treat all Identifier tokens as identifiers,
}
