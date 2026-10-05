export enum TokenType {
    Number,
    Operator,
    LeftParen,
    RightParen,
    EOF,
}
export interface Token {
    type: TokenType;
    value: string;
}
export class Lexer {
    private pos = 0;
    private readonly input: string;
    constructor(input: string) {
        this.input = input;
    }
    private isDigit(ch: string): boolean {
        return ch >= "0" && ch <= "9";
    }
    private isWhite(ch: string): boolean {
        return /\s/.test(ch);
    }
    private peek(): string {
        return this.input[this.pos] ?? "";
    }
    private advance(): string {
        return this.input[this.pos++] ?? "";
    }
    nextToken(): Token {
        while (this.isWhite(this.peek())) this.advance();
        const ch = this.peek();
        if (ch === "") return { type: TokenType.EOF, value: "" };
        if (this.isDigit(ch) || ch === ".") {
            let num = "";
            let dotSeen = false;
            while (this.isDigit(this.peek()) || (!dotSeen && this.peek() === ".")) {
                const c = this.advance();
                if (c === ".") dotSeen = true;
                num += c;
            }
            return { type: TokenType.Number, value: num };
        }
        if ("+-*/^".includes(ch)) {
            this.advance();
            return { type: TokenType.Operator, value: ch };
        }
        if (ch === "(") {
            this.advance();
            return { type: TokenType.LeftParen, value: ch };
        }
        if (ch === ")") {
            this.advance();
            return { type: TokenType.RightParen, value: ch };
        }
        throw new Error(`Unexpected character: ${ch}`);
    }
}
export type ASTNode = NumberNode | PrefixNode | InfixNode;
export class NumberNode {
    constructor(public readonly value: number) {}
}
export class PrefixNode {
    constructor(public readonly operator: string, public readonly right: ASTNode) {}
}
export class InfixNode {
    constructor(public readonly left: ASTNode, public readonly operator: string, public readonly right: ASTNode) {}
}
type PrefixParseFn = (parser: Parser, token: Token) => ASTNode;
type InfixParseFn = (parser: Parser, left: ASTNode, token: Token) => ASTNode;
interface SymbolInfo {
    lbp: number; // left binding power
    nud?: PrefixParseFn;
    led?: InfixParseFn;
}
export class Parser {
    private token!: Token;
    private lexer: Lexer;
    private symbols: Map<string, SymbolInfo> = new Map();
    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.registerSymbols();
        this.next();
    }
    private next(): void {
        this.token = this.lexer.nextToken();
    }
    private register(symbol: string, info: Partial<SymbolInfo>): void {
        const existing = this.symbols.get(symbol) ?? { lbp: 0 };
        this.symbols.set(symbol, { ...existing, ...info });
    }
    private registerSymbols(): void {
        // numbers
        this.register("NUMBER", { nud: (_, t) => new NumberNode(parseFloat(t.value)) });
        // parentheses
        this.register("(", {
            nud: (p) => {
                const expr = p.parseExpression(0);
                if (p.token.type !== TokenType.RightParen) throw new Error("Missing ')'");
                p.next();
                return expr;
            },
        });
        // prefix operators
        const prefixOps = new Set(["+", "-"]);
        for (const op of prefixOps) {
            this.register(op, {
                nud: (p, t) => new PrefixNode(t.value, p.parseExpression(70)),
                lbp: 0,
            });
        }
        // infix operators with precedence
        const infixDefs: [string, number, boolean][] = [
            ["+", 10, false],
            ["-", 10, false],
            ["*", 20, false],
            ["/", 20, false],
            ["^", 30, true], // right-associative
        ];
        for (const [op, lbp, right] of infixDefs) {
            this.register(op, {
                lbp,
                led: (p, left, t) => {
                    const rbp = right ? lbp - 1 : lbp;
                    const rightNode = p.parseExpression(rbp);
                    return new InfixNode(left, t.value, rightNode);
                },
            });
        }
        // EOF
        this.register("EOF", { lbp: 0 });
    }
    private symbolInfo(tok: Token): SymbolInfo {
        if (tok.type === TokenType.Number) return this.symbols.get("NUMBER")!;
        if (tok.type === TokenType.LeftParen) return this.symbols.get("(")!;
        if (tok.type === TokenType.Operator) return this.symbols.get(tok.value)!;
        if (tok.type === TokenType.EOF) return this.symbols.get("EOF")!;
        throw new Error(`No symbol info for token ${tok.value}`);
    }
    parseExpression(rbp: number = 0): ASTNode {
        const t = this.token;
        this.next();
        const nud = this.symbolInfo(t).nud;
        if (!nud) throw new Error(`Unexpected token: ${t.value}`);
        let left = nud(this, t);
        while (rbp < this.symbolInfo(this.token).lbp) {
            const op = this.token;
            this.next();
            const led = this.symbolInfo(op).led!;
            left = led(this, left, op);
        }
        return left;
    }
    parse(): ASTNode {
        const expr = this.parseExpression(0);
        if (this.token.type !== TokenType.EOF) throw new Error("Unexpected input after expression");
        return expr;
    }
}
);
