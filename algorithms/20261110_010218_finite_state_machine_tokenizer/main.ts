import { Lexer } from "./engine";
import { TokenType, Token } from "./types";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error("Assertion failed: " + message);
    }
}

// Helper to compare token arrays (ignoring EOF token for brevity)
function tokensEqual(actual: Token[], expected: Token[]): boolean {
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
        const a = actual[i];
        const e = expected[i];
        if (a.type !== e.type || a.lexeme !== e.lexeme || a.position !== e.position) {
            return false;
        }
    }
    return true;
}

// Unit Test 1: Simple expression
(() => {
    const source = "a = 3 + b";
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const expected: Token[] = [
        { type: TokenType.Identifier, lexeme: "a", position: 0 },
        { type: TokenType.Operator, lexeme: "=", position: 2 },
        { type: TokenType.Number, lexeme: "3", position: 4 },
        { type: TokenType.Operator, lexeme: "+", position: 6 },
        { type: TokenType.Identifier, lexeme: "b", position: 8 },
        { type: TokenType.EOF, lexeme: "", position: source.length }
    ];

    assert(tokensEqual(tokens, expected), "Simple expression tokenization failed");
})();

// Unit Test 2: Empty input
(() => {
    const source = "";
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const expected: Token[] = [
        { type: TokenType.EOF, lexeme: "", position: 0 }
    ];

    assert(tokensEqual(tokens, expected), "Empty input should yield only EOF");
})();

// Unit Test 3: Whitespace only
(() => {
    const source = "   \t\n  ";
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const expected: Token[] = [
        { type: TokenType.EOF, lexeme: "", position: source.length }
    ];

    assert(tokensEqual(tokens, expected), "Whitespace-only input should yield only EOF");
})();

// Unit Test 4: Parentheses and multi-char identifier
(() => {
    const source = "(foo_bar) = 42";
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const expected: Token[] = [
        { type: TokenType.LeftParen, lexeme: "(", position: 0 },
        { type: TokenType.Identifier, lexeme: "foo_bar", position: 1 },
        { type: TokenType.RightParen, lexeme: ")", position: 8 },
        { type: TokenType.Operator, lexeme: "=", position: 10 },
        { type: TokenType.Number, lexeme: "42", position: 12 },
        { type: TokenType.EOF, lexeme: "", position: source.length }
    ];

    assert(tokensEqual(tokens, expected), "Parentheses and identifier tokenization failed");
})();

// Unit Test 5: Unknown character handling
(() => {
    const source = "x $ y";
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const expected: Token[] = [
        { type: TokenType.Identifier, lexeme: "x", position: 0 },
        { type: TokenType.Unknown, lexeme: "$", position: 2 },
        { type: TokenType.Identifier, lexeme: "y", position: 4 },
        { type: TokenType.EOF, lexeme: "", position: source.length }
    ];

    assert(tokensEqual(tokens, expected), "Unknown character handling failed");
})();

// Demo run (prints tokens for a sample input)
(() => {
    const sample = "sum = (a1 + 23) * total";
    const lexer = new Lexer(sample);
    const tokens = lexer.tokenize();
    console.log("Demo tokenization of:", JSON.stringify(sample));
    for (const t of tokens) {
        console.log(`  [${t.position}] ${t.type}: '${t.lexeme}'`);
    }
})();

console.log("All tests passed.");
