import { parse, Expr } from "./core";

function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a && b && typeof a === 'object') {
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const k of keysA) {
            if (!deepEqual(a[k], b[k])) return false;
        }
        return true;
    }
    return false;
}

function assertEqual(actual: any, expected: any, msg: string) {
    if (!deepEqual(actual, expected)) {
        console.error('FAIL:', msg);
        console.error('  Expected:', JSON.stringify(expected, null, 2));
        console.error('  Received:', JSON.stringify(actual, null, 2));
        throw new Error('Assertion failed');
    } else {
        console.log('PASS:', msg);
    }
}

// Test cases
function runTests() {
    // 1+2*3 => 1 + (2 * 3)
    const ast1 = parse("1+2*3");
    const expected1: Expr = {
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'NumberLiteral', value: 1 },
        right: {
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: 2 },
            right: { type: 'NumberLiteral', value: 3 },
        },
    };
    assertEqual(ast1, expected1, '1+2*3 parses with correct precedence');

    // -5+4 => (-5) + 4
    const ast2 = parse("-5+4");
    const expected2: Expr = {
        type: 'BinaryExpression',
        operator: '+',
        left: {
            type: 'PrefixExpression',
            operator: '-',
            right: { type: 'NumberLiteral', value: 5 },
        },
        right: { type: 'NumberLiteral', value: 4 },
    };
    assertEqual(ast2, expected2, '-5+4 parses prefix minus');

    // (1+2)*3 => (1+2) * 3
    const ast3 = parse("(1+2)*3");
    const expected3: Expr = {
        type: 'BinaryExpression',
        operator: '*',
        left: {
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'NumberLiteral', value: 1 },
            right: { type: 'NumberLiteral', value: 2 },
        },
        right: { type: 'NumberLiteral', value: 3 },
    };
    assertEqual(ast3, expected3, '(1+2)*3 parses parentheses');

    // a+b*c
    const ast4 = parse("a+b*c");
    const expected4: Expr = {
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Identifier', name: 'a' },
        right: {
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'Identifier', name: 'b' },
            right: { type: 'Identifier', name: 'c' },
        },
    };
    assertEqual(ast4, expected4, 'a+b*c parses identifiers with precedence');

    // 4/2-1 => (4/2) - 1
    const ast5 = parse("4/2-1");
    const expected5: Expr = {
        type: 'BinaryExpression',
        operator: '-',
        left: {
            type: 'BinaryExpression',
            operator: '/',
            left: { type: 'NumberLiteral', value: 4 },
            right: { type: 'NumberLiteral', value: 2 },
        },
        right: { type: 'NumberLiteral', value: 1 },
    };
    assertEqual(ast5, expected5, '4/2-1 left-associative');
}

runTests();
console.log('All tests passed.');
