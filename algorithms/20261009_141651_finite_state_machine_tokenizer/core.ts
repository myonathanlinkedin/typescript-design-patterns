export enum TokenType {
    Identifier = "Identifier",
    Number = "Number",
    Operator = "Operator",
    Whitespace = "Whitespace",
    Unknown = "Unknown",
    EOF = "EOF"
}

export interface Token {
    type: TokenType;
    value: string;
    start: number; // inclusive
    end: number;   // exclusive
}

// Simple character class discriminator
function charClass(ch: string): "letter" | "digit" | "operator" | "whitespace" | "dot" | "unknown" {
    if (/[a-zA-Z_]/.test(ch)) return "letter";
    if (/[0-9]/.test(ch)) return "digit";
    if (/\s/.test(ch)) return "whitespace";
    if (/[+\-*/=;:,(){}[\]]/.test(ch)) return "operator";
    if (ch === ".") return "dot";
    return "unknown";
}

// Finite State Machine states
enum State {
    Start,
    Identifier,
    Number,
    Operator,
    Whitespace,
    Unknown,
    End
}

// Tokenizer implementation using a deterministic FSM
export class Tokenizer {
    private input: string = "";
    private pos: number = 0;
    private state: State = State.Start;
    private buffer: string = "";
    private tokenStart: number = 0;
    private tokens: Token[] = [];

    public tokenize(input: string): Token[] {
        this.input = input;
        this.pos = 0;
        this.state = State.Start;
        this.buffer = "";
        this.tokens = [];
        this.tokenStart = 0;

        while (this.pos <= this.input.length) {
            const ch = this.pos < this.input.length ? this.input[this.pos] : "\0"; // sentinel
            const cls = this.pos < this.input.length ? charClass(ch) : "unknown";

            switch (this.state) {
                case State.Start:
                    this.tokenStart = this.pos;
                    if (cls === "letter") {
                        this.state = State.Identifier;
                        this.buffer = ch;
                        this.pos++;
                    } else if (cls === "digit") {
                        this.state = State.Number;
                        this.buffer = ch;
                        this.pos++;
                    } else if (cls === "dot") {
                        // Numbers may start with a dot (e.g., .5)
                        this.state = State.Number;
                        this.buffer = ch;
                        this.pos++;
                    } else if (cls === "operator") {
                        this.emitToken(TokenType.Operator, ch, this.pos, this.pos + 1);
                        this.pos++;
                    } else if (cls === "whitespace") {
                        this.state = State.Whitespace;
                        this.pos++;
                    } else if (cls === "unknown") {
                        this.emitToken(TokenType.Unknown, ch, this.pos, this.pos + 1);
                        this.pos++;
                    } else {
                        // End of input
                        this.state = State.End;
                    }
                    break;

                case State.Identifier:
                    if (cls === "letter" || cls === "digit") {
                        this.buffer += ch;
                        this.pos++;
                    } else {
                        this.emitToken(TokenType.Identifier, this.buffer, this.tokenStart, this.pos);
                        this.buffer = "";
                        this.state = State.Start;
                    }
                    break;

                case State.Number:
                    if (cls === "digit") {
                        this.buffer += ch;
                        this.pos++;
                    } else if (cls === "dot" && !this.buffer.includes(".")) {
                        // Allow a single dot for floating point literals
                        this.buffer += ch;
                        this.pos++;
                    } else {
                        // Validate numeric format: reject trailing dot
                        const valid = this.buffer !== "." && !this.buffer.endsWith(".");
                        const type = valid ? TokenType.Number : TokenType.Unknown;
                        this.emitToken(type, this.buffer, this.tokenStart, this.pos);
                        this.buffer = "";
                        this.state = State.Start;
                    }
                    break;

                case State.Whitespace:
                    if (cls === "whitespace") {
                        this.pos++;
                    } else {
                        this.state = State.Start;
                    }
                    break;

                case State.End:
                    // Emit EOF token and break loop
                    this.emitToken(TokenType.EOF, "", this.pos, this.pos);
                    this.pos = this.input.length + 1; // force exit
                    break;

                default:
                    // Should never reach here
                    throw new Error(`Invalid FSM state: ${this.state}`);
            }
        }

        // Remove the trailing EOF token for typical consumer convenience
        if (this.tokens.length && this.tokens[this.tokens.length - 1].type === TokenType.EOF) {
            this.tokens.pop();
        }
        return this.tokens;
    }

    private emitToken(type: TokenType, value: string, start: number, end: number): void {
        this.tokens.push({ type, value, start, end });
    }
}

// Simple lexical parser that groups tokens into statements terminated by semicolons
export interface Statement {
    tokens: Token[];
    start: number;
    end: number;
}

export class Parser {
    public parse(tokens: Token[]): Statement[] {
        const statements: Statement[] = [];
        let current: Token[] = [];
        let stmtStart = tokens.length ? tokens[0].start : 0;

        for (const token of tokens) {
            current.push(token);
            if (token.type === TokenType.Operator && token.value === ";") {
                statements.push({
                    tokens: current.slice(),
                    start: stmtStart,
                    end: token.end
                });
                current = [];
                // Next statement start is the next token's start if any
                const nextIdx = tokens.indexOf(token) + 1;
                if (nextIdx < tokens.length) {
                    stmtStart = tokens[nextIdx].start;
                }
            }
        }

        // Capture trailing tokens without a terminating semicolon as a statement
        if (current.length) {
            const last = current[current.length - 1];
            statements.push({
                tokens: current,
                start: stmtStart,
                end: last.end
            });
        }

        return statements;
    }
}
