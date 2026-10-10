export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export type JSONArray = JSONValue[];

export class JSONParser {
    private text!: string;
    private pos: number = 0;
    private len: number = 0;

    public parse(text: string): JSONValue {
        this.text = text;
        this.pos = 0;
        this.len = text.length;
        const value = this.parseValue();
        this.skipWhitespace();
        if (this.pos !== this.len) this.error('Unexpected trailing characters');
        return value;
    }

    private parseValue(): JSONValue {
        this.skipWhitespace();
        const ch = this.peek();
        if (ch === '"') return this.parseString();
        if (ch === '-' || this.isDigit(ch)) return this.parseNumber();
        if (ch === '{') return this.parseObject();
        if (ch === '[') return this.parseArray();
        if (this.text.startsWith('true', this.pos)) { this.pos += 4; return true; }
        if (this.text.startsWith('false', this.pos)) { this.pos += 5; return false; }
        if (this.text.startsWith('null', this.pos)) { this.pos += 4; return null; }
        this.error('Unexpected token');
    }

    private parseObject(): JSONObject {
        const obj: JSONObject = {};
        this.expect('{');
        this.skipWhitespace();
        if (this.peek() === '}') { this.pos++; return obj; }
        while (true) {
            this.skipWhitespace();
            const key = this.parseString();
            this.skipWhitespace();
            this.expect(':');
            const value = this.parseValue();
            obj[key] = value;
            this.skipWhitespace();
            const next = this.peek();
            if (next === '}') { this.pos++; break; }
            if (next === ',') { this.pos++; continue; }
            this.error('Expected , or } in object');
        }
        return obj;
    }

    private parseArray(): JSONArray {
        const arr: JSONArray = [];
        this.expect('[');
        this.skipWhitespace();
        if (this.peek() === ']') { this.pos++; return arr; }
        while (true) {
            const val = this.parseValue();
            arr.push(val);
            this.skipWhitespace();
            const next = this.peek();
            if (next === ']') { this.pos++; break; }
            if (next === ',') { this.pos++; continue; }
            this.error('Expected , or ] in array');
        }
        return arr;
    }

    private parseString(): string {
        this.expect('"');
        let result = '';
        while (true) {
            if (this.pos >= this.len) this.error('Unterminated string');
            const ch = this.text[this.pos++];
            if (ch === '"') break;
            if (ch === '\\') {
                if (this.pos >= this.len) this.error('Unterminated escape');
                const esc = this.text[this.pos++];
                switch (esc) {
                    case '"': result += '"'; break;
                    case '\\': result += '\\'; break;
                    case '/': result += '/'; break;
                    case 'b': result += '\b'; break;
                    case 'f': result += '\f'; break;
                    case 'n': result += '\n'; break;
                    case 'r': result += '\r'; break;
                    case 't': result += '\t'; break;
                    case 'u':
                        const hex = this.text.substr(this.pos, 4);
                        if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.error('Invalid Unicode escape');
                        result += String.fromCharCode(parseInt(hex, 16));
                        this.pos += 4;
                        break;
                    default:
                        this.error(`Invalid escape character \\${esc}`);
                }
            } else {
                if (ch < ' ') this.error('Invalid control character in string');
                result += ch;
            }
        }
        return result;
    }

    private parseNumber(): number {
        const start = this.pos;
        const ch = this.peek();
        if (ch === '-') this.pos++;
        if (this.peek() === '0') {
            this.pos++;
        } else if (this.isDigit1to9(this.peek())) {
            this.pos++;
            while (this.isDigit(this.peek())) this.pos++;
        } else {
            this.error('Invalid number');
        }
        if (this.peek() === '.') {
            this.pos++;
            if (!this.isDigit(this.peek())) this.error('Invalid fractional part');
            while (this.isDigit(this.peek())) this.pos++;
        }
        const e = this.peek();
        if (e === 'e' || e === 'E') {
            this.pos++;
            const sign = this.peek();
            if (sign === '+' || sign === '-') this.pos++;
            if (!this.isDigit(this.peek())) this.error('Invalid exponent');
            while (this.isDigit(this.peek())) this.pos++;
        }
        const numStr = this.text.substring(start, this.pos);
        const num = Number(numStr);
        if (!Number.isFinite(num)) this.error('Number out of range');
        return num;
    }

    private skipWhitespace(): void {
        while (this.pos < this.len) {
            const ch = this.text[this.pos];
            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') this.pos++;
            else break;
        }
    }

    private expect(ch: string): void {
        if (this.peek() !== ch) this.error(`Expected '${ch}'`);
        this.pos++;
    }

    private peek(): string {
        return this.pos < this.len ? this.text[this.pos] : '';
    }

    private isDigit(ch: string): boolean {
        return ch >= '0' && ch <= '9';
    }

    private isDigit1to9(ch: string): boolean {
        return ch >= '1' && ch <= '9';
    }

    private error(msg: string): never {
        throw new SyntaxError(`${msg} at position ${this.pos}`);
    }
}
