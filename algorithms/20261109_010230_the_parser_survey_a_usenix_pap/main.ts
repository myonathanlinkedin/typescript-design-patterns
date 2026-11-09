import { Parser, evaluate } from './core';
import * as assert from 'assert';

// Simple test harness
function runTests(): void {
    // Positive test cases
    const cases: Array<{ expr: string; expected: number }> = [
        { expr: '42', expected: 42 },
        { expr: '  7  ', expected: 7 },
        { expr: '1+2', expected: 3 },
        { expr: '4-5', expected: -1 },
        { expr: '6*7', expected: 42 },
        { expr: '8/2', expected: 4 },
        { expr: '1+2*3', expected: 7 },
        { expr: '(1+2)*3', expected: 9 },
        { expr: '-5', expected: -5 },
        { expr: '+5', expected: 5 },
        { expr: '--5', expected: 5 },
        { expr: '-+5', expected: -5 },
        { expr: '10/ (2+3)', expected: 2 },
        { expr: ' ( ( 2 ) ) ', expected: 2 },
        { expr: '0', expected: 0 },
        { expr: '123456789', expected: 123456789 },
        { expr: '3+4*2/(1-5)', expected: 1 }, // 3 + (8 / -4) = 3 -2 =1
        { expr: '3 +   4 *   2 / ( 1 - 5 )', expected: 1 },
    ];

    for (const { expr, expected } of cases) {
        const parser = new Parser(expr);
        const ast = parser.parse();
        const result = evaluate(ast);
        assert.strictEqual(result, expected, `Expression "${expr}" evaluated to ${result}, expected ${expected}`);
    }

    // Negative test cases – should throw
    const errorCases: string[] = [
        '',
        '   ',
        '+',
        '-',
        '*',
        '/',
        '1++2',
        '1**2',
        '1//2',
        '(1+2',
        '1+2)',
        'abc',
        '1/0',
    ];

    for (const expr of errorCases) {
        let threw = false;
        try {
            const parser = new Parser(expr);
            const ast = parser.parse();
            evaluate(ast);
        } catch (e) {
            threw = true;
        }
        assert.ok(threw, `Expression "${expr}" should have thrown an error`);
    }

    console.log('All unit tests passed.');
}

// Simple benchmark (deterministic, small scale)
function runBenchmark(): void {
    const expr = '((1+2)*(3+4)-(5/6)+7)*8-9/10+11*12-13+14/15';
    const iterations = 100_000;
    const start = Date.now();
    for (let i = 0; i < iterations; ++i) {
        const parser = new Parser(expr);
        const ast = parser.parse();
        evaluate(ast);
    }
    const duration = Date.now() - start;
    console.log(`Benchmark: ${iterations} parses/evaluations in ${duration} ms`);
}

// Entry point
if (require.main === module) {
    runTests();
    runBenchmark();
}
