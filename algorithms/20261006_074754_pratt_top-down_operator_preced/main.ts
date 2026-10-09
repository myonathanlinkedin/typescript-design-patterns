import { parse, ASTNode } from './core';
import * as assert from 'assert';
import { performance } from 'perf_hooks';

function astEqual(a: ASTNode, b: ASTNode): boolean {
    if (a.type !== b.type) return false;
    switch (a.type) {
        case 'NumberLiteral':
            return a.value === (b as any).value;
        case 'Identifier':
            return a.name === (b as any).name;
        case 'BinaryExpression':
            return a.operator === (b as any).operator &&
                astEqual(a.left, (b as any).left) &&
                astEqual(a.right, (b as any).right);
        case 'UnaryExpression':
            return a.operator === (b as any).operator &&
                astEqual(a.argument, (b as any).argument);
        case 'Grouping':
            return astEqual(a.expression, (b as any).expression);
    }
    return false;
}

function testParser() {
    const tests: [string, ASTNode][] = [
        ['42', { type: 'NumberLiteral', value: 42 }],
        ['x', { type: 'Identifier', name: 'x' }],
        ['-5', { type: 'UnaryExpression', operator: '-', argument: { type: 'NumberLiteral', value: 5 } }],
        ['a + b * c', {
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'Identifier', name: 'a' },
            right: {
                type: 'BinaryExpression',
                operator: '*',
                left: { type: 'Identifier', name: 'b' },
                right: { type: 'Identifier', name: 'c' }
            }
        }],
        ['(1 + 2) * 3', {
            type: 'BinaryExpression',
            operator: '*',
            left: {
                type: 'Grouping',
                expression: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: { type: 'NumberLiteral', value: 1 },
                    right: { type: 'NumberLiteral', value: 2 }
                }
            },
            right: { type: 'NumberLiteral', value: 3 }
        }],
        ['2 ^ 3 ^ 2', {
            type: 'BinaryExpression',
            operator: '^',
            left: { type: 'NumberLiteral', value: 2 },
            right: {
                type: 'BinaryExpression',
                operator: '^',
                left: { type: 'NumberLiteral', value: 3 },
                right: { type: 'NumberLiteral', value: 2 }
            }
        }]
    ];
    for (const [expr, expected] of tests) {
        const result = parse(expr);
        assert.ok(astEqual(result, expected), `Failed parsing '${expr}'`);
    }
    console.log('All parser tests passed.');
}

function benchmark() {
    const expr = '((a + b) * (c - d)) / e ^ f + g';
    const iterations = 100000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        parse(expr);
    }
    const end = performance.now();
    console.log(`Parsed ${iterations} expressions in ${(end - start).toFixed(2)} ms`);
}

function main() {
    testParser();
    benchmark();
}

if (require.main === module) {
    main();
}
