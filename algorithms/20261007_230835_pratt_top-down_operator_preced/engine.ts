import { Token, TokenType, ASTNode, NumberLiteral, PrefixExpression, BinaryExpression } from "./types";

export function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    const length = input.length;
    let pos = 0;

    const isDigit = (ch: string) => /[0-9]/.test(ch);
    const isWhite = (ch: string) => /\s/.test(ch);
    const isOperator = (ch: string) => /[+\-*/^]/.test(ch);

    while (pos < length) {
        const ch = input[pos];
        if (isWhite(ch)) {
            pos++;
            continue;
        }
        if (isDigit(ch) || (ch === '.' && isDigit(input[pos + 1]))) {
            let start = pos;
            while (pos < length && (isDigit(input[pos]) || input[pos] === '.')) pos++;
            tokens.push({ type: TokenType.Number, value: input.slice(start, pos), pos: start });
            continue;
        }
        if (isOperator(ch)) {
            tokens.push({ type: TokenType.Operator, value: ch, pos });
            pos++;
            continue;
        }
        if (ch === '(') {
            tokens.push({ type: TokenType.LeftParen, value: ch, pos });
            pos++;
            continue;
        }
        if (ch === ')') {
            tokens.push({ type: TokenType.RightParen, value: ch, pos });
            pos++;
            continue;
        }
        throw new Error(`Unexpected character '${ch}' at position ${pos}`);
    }
    tokens.push({ type: TokenType.EOF, value: "", pos });
    return tokens;
}

type PrefixParseFn = () => ASTNode;
type InfixParseFn = (left: ASTNode) => ASTNode;

export class Parser {
    private tokens: Token[];
    private pos: number = 0;

    private prefixParseFns: Map<string, PrefixParseFn> = new Map();
    private infixParseFns: Map<string, InfixParseFn> = new Map();

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.registerParseFns();
    }

    private registerParseFns() {
        // Prefixes
        this.prefixParseFns.set("Number", this.parseNumberLiteral.bind(this));
        this.prefixParseFns.set("-", this.parsePrefixExpression.bind(this));
        this.prefixParseFns.set("+", this.parsePrefixExpression.bind(this));
        this.prefixParseFns.set("(", this.parseGroupedExpression.bind(this));

        // Infixes
        const infixOperators = ["+", "-", "*", "/", "^"];
        for (const op of infixOperators) {
            this.infixParseFns.set(op, this.parseInfixExpression.bind(this));
        }
    }

    private peek(): Token {
        return this.tokens[this.pos];
    }

    private next(): Token {
        const cur = this.tokens[this.pos];
        this.pos++;
        return cur;
    }

    private expect(type: TokenType, value?: string) {
        const token = this.peek();
        if (token.type !== type || (value !== undefined && token.value !== value)) {
            throw new Error(`Expected token ${TokenType[type]} '${value ?? ""}' but got ${TokenType[token.type]} '${token.value}' at position ${token.pos}`);
        }
        this.next();
    }

    private getPrecedence(op: string): number {
        switch (op) {
            case "+":
            case "-":
                return 10;
            case "*":
            case "/":
                return 20;
            case "^":
                return 30;
            default:
                return 0;
        }
    }

    private isRightAssociative(op: string): boolean {
        return op === "^";
    }

    public parseExpression(minPrec: number = 0): ASTNode {
        const token = this.next();
        const prefixFn = this.prefixParseFns.get(this.prefixKey(token));
        if (!prefixFn) {
            throw new Error(`No prefix parse function for token '${token.value}' at position ${token.pos}`);
        }
        let left = prefixFn();

        while (true) {
            const nextToken = this.peek();
            if (nextToken.type !== TokenType.Operator) break;
            const prec = this.getPrecedence(nextToken.value);
            if (prec < minPrec) break;

            const op = nextToken.value;
            this.next(); // consume operator
            const infixFn = this.infixParseFns.get(op);
            if (!infixFn) {
                throw new Error(`No infix parse function for operator '${op}'`);
            }

            const nextMinPrec = this.isRightAssociative(op) ? prec : prec + 1;
            const right = this.parseExpression(nextMinPrec);
            left = infixFn(left);
            // The infixFn will use the captured operator and right node
            // To pass right, we bind it via closure
            // We'll replace infixFn with a wrapper that captures right
            // However, for simplicity, we recompute here:
            left = {
                type: "BinaryExpression",
                operator: op,
                left,
                right,
            } as BinaryExpression;
        }

        return left;
    }

    private prefixKey(token: Token): string {
        switch (token.type) {
            case TokenType.Number:
                return "Number";
            case TokenType.Operator:
                return token.value;
            case TokenType.LeftParen:
                return "(";
            default:
                return "";
        }
    }

    private parseNumberLiteral(): ASTNode {
        const token = this.tokens[this.pos - 1]; // number token already consumed
        return {
            type: "NumberLiteral",
            value: parseFloat(token.value),
        } as NumberLiteral;
    }

    private parsePrefixExpression(): ASTNode {
        const operatorToken = this.tokens[this.pos - 1]; // operator token already consumed
        const right = this.parseExpression(this.getPrecedence(operatorToken.value));
        return {
            type: "PrefixExpression",
            operator: operatorToken.value,
            right,
        } as PrefixExpression;
    }

    private parseGroupedExpression(): ASTNode {
        const expr = this.parseExpression(0);
        this.expect(TokenType.RightParen);
        return expr;
    }

    private parseInfixExpression(left: ASTNode): ASTNode {
        // This method is not used directly because we construct BinaryExpression inline.
        // Kept for completeness.
        return left;
    }
}
));
