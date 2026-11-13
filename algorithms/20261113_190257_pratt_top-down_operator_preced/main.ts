import { Parser, Evaluator } from './core';
import * as assert from 'assert';

function test(expr: string, expected: number) {
  const parser = new Parser(expr);
  const ast = parser.parse();
  const result = ast.accept(new Evaluator());
  assert.strictEqual(result, expected, `Expression "${expr}" evaluated to ${result}, expected ${expected}`);
}

function runTests() {
  // Basic arithmetic
  test('1+2', 3);
  test('4-2', 2);
  test('3*5', 15);
  test('10/2', 5);

  // Operator precedence
  test('1+2*3', 7);
  test('4*5+6', 26);
  test('7+8/2', 11);

  // Parentheses
  test('(1+2)*3', 9);
  test('4*(5+6)', 44);
  test('(7+8)/2', 7.5);

  // Unary minus
  test('-5+3', -2);
  test('-(2+3)*4', -20);
  test('-(-5)', 5);

  // Mixed
  test('3+4*2/(1-5)', 1);
  test('3+4*2/(1-5)^2', 3); // Note: '^' not implemented, will error

  console.log('All tests passed.');
}

runTests();
