import { Tokenizer, Parser } from './engine';
import { TokenType, ParserError } from './types';
import * as assert from 'assert';

function testTokenizer() {
  const input = 'var x = 42 + y * (z - 3.14);';
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const filtered = tokens.filter(
    (t) => t.type !== TokenType.Whitespace && t.type !== TokenType.EOF
  );
  const expectedTypes = [
    TokenType.Identifier,
    TokenType.Identifier,
    TokenType.Operator,
    TokenType.Number,
    TokenType.Operator,
    TokenType.Identifier,
    TokenType.Operator,
    TokenType.LeftParen,
    TokenType.Identifier,
    TokenType.Operator,
    TokenType.Number,
    TokenType.RightParen,
    TokenType.Operator,
  ];
  assert.deepStrictEqual(filtered.map((t) => t.type), expectedTypes);
}

function testParser() {
  const input = '1 + 2 * 3 - 4 / 2';
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseExpression();
  const expected = {
    type: 'BinaryExpression',
    operator: '-',
    left: {
      type: 'BinaryExpression',
      operator: '+',
      left: { type: 'NumberLiteral', value: 1 },
      right: {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'NumberLiteral', value: 2 },
        right: { type: 'NumberLiteral', value: 3 },
      },
    },
    right: {
      type: 'BinaryExpression',
      operator: '/',
      left: { type: 'NumberLiteral', value: 4 },
      right: { type: 'NumberLiteral', value: 2 },
    },
  };
  assert.deepStrictEqual(ast, expected);
}

function testErrorHandling() {
  const input = '1 + (2 * 3';
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  assert.throws(() => parser.parseExpression(), ParserError);
}

function testStringLiteral() {
  const input = '"hello \\"world\\"" + \'test\'';
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const filtered = tokens.filter(
    (t) => t.type !== TokenType.Whitespace && t.type !== TokenType.EOF
  );
  const stringTokens = filtered.filter((t) => t.type === TokenType.String);
  assert.strictEqual(stringTokens.length, 2);
  assert.strictEqual(stringTokens[0].value, 'hello "world"');
  assert.strictEqual(stringTokens[1].value, 'test');
}

function testUnknownCharacter() {
  const input = '@';
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const filtered = tokens.filter(
    (t) => t.type !== TokenType.Whitespace && t.type !== TokenType.EOF
  );
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].type, TokenType.Unknown);
  assert.strictEqual(filtered[0].value, '@');
}

function testWhitespaceOnly() {
  const input = '   \t\n';
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const filtered = tokens.filter(
    (t) => t.type !== TokenType.Whitespace && t.type !== TokenType.EOF
  );
  assert.strictEqual(filtered.length, 0);
}

function testUnclosedString() {
  const input = '"abc';
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const stringToken = tokens.find((t) => t.type === TokenType.String);
  assert.ok(stringToken);
  assert.strictEqual(stringToken!.value, 'abc');
}

function main() {
  console.log('Running tests...');
  testTokenizer();
  console.log('Tokenizer tests passed');
  testParser();
  console.log('Parser tests passed');
  testErrorHandling();
  console.log('Error handling tests passed');
  testStringLiteral();
  console.log('String literal tests passed');
  testUnknownCharacter();
  console.log('Unknown character tests passed');
  testWhitespaceOnly();
  console.log('Whitespace only tests passed');
  testUnclosedString();
  console.log('Unclosed string tests passed');
  console.log('All tests passed.');
}

main();
);
