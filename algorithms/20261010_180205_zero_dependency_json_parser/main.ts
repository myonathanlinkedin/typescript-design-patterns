import { JSONParser, JSONValue } from "./core";

function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a && b && typeof a === 'object') {
        if (Array.isArray(a)) {
            if (!Array.isArray(b) || a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
            return true;
        }
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

function assertEquals(actual: any, expected: any, msg?: string): void {
    if (!deepEqual(actual, expected)) {
        throw new Error(msg ?? `Assertion failed. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function assertThrows(fn: () => any, msg?: string): void {
    let threw = false;
    try { fn(); } catch (_) { threw = true; }
    if (!threw) throw new Error(msg ?? 'Expected function to throw');
}

function runTests(): void {
    const parser = new JSONParser();

    // Primitive values
    assertEquals(parser.parse('null'), null);
    assertEquals(parser.parse('true'), true);
    assertEquals(parser.parse('false'), false);
    assertEquals(parser.parse('123'), 123);
    assertEquals(parser.parse('-0.5'), -0.5);
    assertEquals(parser.parse('"hello"'), 'hello');

    // String escapes
    assertEquals(parser.parse('"\\\"\\\\\\/\\b\\f\\n\\r\\t"'), "\"\\/\b\f\n\r\t");
    assertEquals(parser.parse('"\\u0041"'), 'A');

    // Arrays
    assertEquals(parser.parse('[]'), []);
    assertEquals(parser.parse('[1,2,3]'), [1, 2, 3]);
    assertEquals(parser.parse('[true,null,"x"]'), [true, null, 'x']);
    assertEquals(parser.parse('[{"a":10},[20,30]]'), [{ a: 10 }, [20, 30]]);

    // Objects
    assertEquals(parser.parse('{"a":1,"b":true,"c":null}'), { a: 1, b: true, c: null });
    assertEquals(parser.parse('{"nested":{"x":[1,2]}}'), { nested: { x: [1, 2] } });

    // Whitespace tolerance
    assertEquals(parser.parse(' { "a" : [ 1 , 2 ] } '), { a: [1, 2] });

    // Invalid JSON
    assertThrows(() => parser.parse('{'), 'Unclosed object');
    assertThrows(() => parser.parse('["a",]'), 'Trailing comma in array');
    assertThrows(() => parser.parse('{"a":1 "b":2}'), 'Missing comma between members');
    assertThrows(() => parser.parse('{"a":}'), 'Missing value');
    assertThrows(() => parser.parse('{"a":1,}'), 'Trailing comma in object');
    assertThrows(() => parser.parse('tru'), 'Invalid literal');
    assertThrows(() => parser.parse('"unterminated'), 'Unterminated string');
    assertThrows(() => parser.parse('012'), 'Invalid number with leading zero');
    assertThrows(() => parser.parse('1..0'), 'Invalid number format');
    assertThrows(() => parser.parse('[1 2]'), 'Missing comma in array');
    console.log('All tests passed.');
}

runTests();
}
