import { strict as assert } from 'assert';
import { Lexer, Parser, TokenType, Token, ASTNode, NumberLiteral, IdentifierNode, BinaryExpression } from './engine';

function compareTokens(actual: Token[], expected: Token[]): void {
  assert.strictEqual(actual.length, expected.length, 'Token count mismatch');
  for (let i = 0; i < actual.length; i++) {
    assert.strictEqual(actual[i].type, expected[i].type, `Token type mismatch at index ${i}`);
    assert.strictEqual(actual[i].value, expected[i].value, `Token value mismatch at index ${i}`);
  }
}

function testLexer(input: string, expected: Token[]): void {
  const lexer = new Lexer(input);
  const tokens: Token[] = [];
  let token = lexer.nextToken();
  while (token.type !== TokenType.EOF) {
    tokens.push(token);
    token = lexer.nextToken();
  }
  tokens.push(token); // EOF
  compareTokens(tokens, expected);
}

function testParser(input: string, expectedAST: ASTNode): void {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const ast = parser.parse();
  assert.deepStrictEqual(ast, expectedAST);
}

function testParserError(input: string, expectedMessage: string): void {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  assert.throws(() => parser.parse(), new RegExp(expectedMessage));
}

// Lexer tests
testLexer('', [
  { type: TokenType.EOF, value: '', position: 0 },
]);

testLexer('   \t\n', [
  { type: TokenType.Whitespace, value: '   \t\n', position: 0 },
  { type: TokenType.EOF, value: '', position: 4 },
]);

testLexer('42', [
  { type: TokenType.Number, value: '42', position: 0 },
  { type: TokenType.EOF, value: '', position: 2 },
]);

testLexer('3.14', [
  { type: TokenType.Number, value: '3.14', position: 0 },
  { type: TokenType.EOF, value: '', position: 4 },
]);

testLexer('foo_bar123', [
  { type: TokenType.Identifier, value: 'foo_bar123', position: 0 },
  { type: TokenType.EOF, value: '', position: 9 },
]);

testLexer('1 + 2 * (3 - 4)', [
  { type: TokenType.Number, value: '1', position: 0 },
  { type: TokenType.Whitespace, value: ' ', position: 1 },
  { type: TokenType.Operator, value: '+', position: 2 },
  { type: TokenType.Whitespace, value: ' ', position: 3 },
  { type: TokenType.Number, value: '2', position: 4 },
  { type: TokenType.Whitespace, value: ' ', position: 5 },
  { type: TokenType.Operator, value: '*', position: 6 },
  { type: TokenType.Whitespace, value: ' ', position: 7 },
  { type: TokenType.LeftParen, value: '(', position: 8 },
  { type: TokenType.Number, value: '3', position: 9 },
  { type: TokenType.Whitespace, value: ' ', position: 10 },
  { type: TokenType.Operator, value: '-', position: 11 },
  { type: TokenType.Whitespace, value: ' ', position: 12 },
  { type: TokenType.Number, value: '4', position: 13 },
  { type: TokenType.RightParen, value: ')', position: 14 },
  { type: TokenType.EOF, value: '', position: 15 },
]);

testLexer('5.', [
  { type: TokenType.Number, value: '5', position: 0 },
  { type: TokenType.Operator, value: '.', position: 1 },
  { type: TokenType.EOF, value: '', position: 2 },
]);

// Parser tests
testParser('42', { type: 'NumberLiteral', value: 42 });

testParser('3.14', { type: 'NumberLiteral', value: 3.14 });

testParser('foo', { type: 'Identifier', name: 'foo' });

testParser('1 + 2 * 3', {
  type: 'BinaryExpression',
  operator: '+',
  left: { type: 'NumberLiteral', value: 1 },
  right: {
    type: 'BinaryExpression',
    operator: '*',
    left: { type: 'NumberLiteral', value: 2 },
    right: { type: 'NumberLiteral', value: 3 },
  },
});

testParser('(1 + 2) * 3', {
  type: 'BinaryExpression',
  operator: '*',
  left: {
    type: 'BinaryExpression',
    operator: '+',
    left: { type: 'NumberLiteral', value: 1 },
    right: { type: 'NumberLiteral', value: 2 },
  },
  right: { type: 'NumberLiteral', value: 3 },
});

testParserError('1 & 2', 'Unexpected token at position 2');

testParserError('1 + (2 * 3', 'Expected \')\' at position 8');

testParserError('1 +', 'Unexpected token at position 4');

testParserError('-1', 'Unexpected token at position 0');

// Demonstration
const demoInput = '2 * (3 + 4) - 5';
const lexer = new Lexer(demoInput);
const parser = new Parser(lexer);
const ast = parser.parse();
console.log('AST for', demoInput, ':', JSON.stringify(ast, null, 2));
