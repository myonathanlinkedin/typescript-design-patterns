export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export interface ParseSuccess<T> {
    success: true;
    value: T;
    rest: string;
}

export interface ParseFailure {
    success: false;
    error: string;
}

/**
 * A parser consumes a string and returns a ParseResult.
 */
export type Parser<T> = (input: string) => ParseResult<T>;

/**
 * Primitive parser that always fails with a given message.
 */
export function fail<T>(msg: string): Parser<T> {
    return (input) => ({ success: false, error: msg });
}

/**
 * Primitive parser that succeeds without consuming input.
 */
export function succeed<T>(value: T): Parser<T> {
    return (input) => ({ success: true, value, rest: input });
}

/**
 * Parser that matches a literal string.
 */
export function str(expected: string): Parser<string> {
    return (input) => {
        if (input.startsWith(expected)) {
            return { success: true, value: expected, rest: input.slice(expected.length) };
        }
        return { success: false, error: `Expected "${expected}"` };
    };
}

/**
 * Parser that matches a regular expression at the start of the input.
 * The regex must have the global flag disabled and must not be sticky.
 */
export function regex(re: RegExp): Parser<string> {
    if (re.global || re.sticky) {
        throw new Error('regex parser requires a non-global, non-sticky RegExp');
    }
    return (input) => {
        const match = re.exec(input);
        if (match && match.index === 0) {
            const matched = match[0];
            return { success: true, value: matched, rest: input.slice(matched.length) };
        }
        return { success: false, error: `Regex ${re} did not match` };
    };
}

/**
 * Functor map: transforms the successful value.
 */
export function map<A, B>(parser: Parser<A>, fn: (a: A) => B): Parser<B> {
    return (input) => {
        const res = parser(input);
        if (res.success) {
            return { success: true, value: fn(res.value), rest: res.rest };
        }
        return res;
    };
}

/**
 * Monad flatMap / chain: feeds the parsed value into another parser.
 */
export function flatMap<A, B>(parser: Parser<A>, fn: (a: A) => Parser<B>): Parser<B> {
    return (input) => {
        const res = parser(input);
        if (!res.success) return res;
        return fn(res.value)(res.rest);
    };
}

/**
 * Sequential composition: runs p1 then p2 and returns a tuple of their results.
 */
export function seq<A, B>(p1: Parser<A>, p2: Parser<B>): Parser<[A, B]> {
    return flatMap(p1, (a) => map(p2, (b) => [a, b] as [A, B]));
}

/**
 * Choice combinator: tries p1, if it fails tries p2.
 */
export function or<A>(p1: Parser<A>, p2: Parser<A>): Parser<A> {
    return (input) => {
        const r1 = p1(input);
        if (r1.success) return r1;
        return p2(input);
    };
}

/**
 * Parses zero or more repetitions of parser p, collecting results in an array.
 */
export function many<A>(p: Parser<A>): Parser<A[]> {
    return (input) => {
        const results: A[] = [];
        let rest = input;
        while (true) {
            const r = p(rest);
            if (!r.success) break;
            results.push(r.value);
            rest = r.rest;
        }
        return { success: true, value: results, rest };
    };
}

/**
 * Parses one or more repetitions of parser p.
 */
export function many1<A>(p: Parser<A>): Parser<A[]> {
    return flatMap(p, (first) =>
        map(many(p), (rest) => [first, ...rest])
    );
}

/**
 * Optional parser: returns the parsed value or undefined without consuming on failure.
 */
export function optional<A>(p: Parser<A>): Parser<A | undefined> {
    return (input) => {
        const r = p(input);
        if (r.success) return r;
        return { success: true, value: undefined, rest: input };
    };
}

/**
 * Trims leading whitespace before applying parser p.
 */
export function token<A>(p: Parser<A>): Parser<A> {
    const ws = regex(/^\s*/);
    return flatMap(ws, () => p);
}

/**
 * Helper to run a parser on an input string, throwing on failure.
 */
export function run<A>(parser: Parser<A>, input: string): A {
    const res = parser(input);
    if (!res.success) {
        throw new Error(`Parse error: ${res.error} (at "${input}")`);
    }
    return res.value;
}

/**
 * Example: arithmetic expression parser (integer literals, +, *, parentheses).
 * Returns a number.
 */
export const numberParser: Parser<number> = map(
    token(regex(/^[0-9]+/)),
    (s) => parseInt(s, 10)
);

export const parens: Parser<number> = flatMap(
    token(str('(')),
    () => flatMap(expr, (e) =>
        flatMap(token(str(')')), () => succeed(e))
    )
);

export const factor: Parser<number> = or(numberParser, parens);

export const term: Parser<number> = flatMap(
    factor,
    (first) => map(
        many(
            flatMap(
                token(or(str('*'), str('/'))),
                (op) => map(factor, (rhs) => ({ op, rhs }))
            )
        ),
        (rest) => rest.reduce((acc, { op, rhs }) => {
            return op === '*' ? acc * rhs : Math.trunc(acc / rhs);
        }, first)
    )
);

export const expr: Parser<number> = flatMap(
    term,
    (first) => map(
        many(
            flatMap(
                token(or(str('+'), str('-'))),
                (op) => map(term, (rhs) => ({ op, rhs }))
            )
        ),
        (rest) => rest.reduce((acc, { op, rhs }) => {
            return op === '+' ? acc + rhs : acc - rhs;
        }, first)
    )
);
