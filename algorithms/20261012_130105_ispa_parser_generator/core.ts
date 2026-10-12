export type Terminal =
  | { type: 'literal'; value: string }
  | { type: 'regex'; pattern: RegExp };

export type NonTerminal = { type: 'nonterminal'; name: string };

export type Symbol = Terminal | NonTerminal;

export type Production = Symbol[];

export interface Grammar {
  /** start symbol name */
  start: string;
  /** map from non‑terminal name to its alternatives */
  rules: Record<string, Production[]>;
}

/** Node of the parse tree */
export interface ParseNode {
  /** name of the rule (non‑terminal) or literal value for terminals */
  name: string;
  /** consumed text (only for terminal nodes) */
  text?: string;
  /** child nodes (only for non‑terminal nodes) */
  children?: ParseNode[];
}

/** Simple recursive‑descent parser with backtracking.
 *  It does **not** support left‑recursive grammars.
 */
export class Parser {
  private readonly grammar: Grammar;
  private input!: string;
  private pos!: number;

  constructor(grammar: Grammar) {
    this.grammar = grammar;
  }

  /** Parse the whole input string. Returns the root ParseNode or null on failure. */
  parse(input: string): ParseNode | null {
    this.input = input;
    this.pos = 0;
    const node = this.parseNonTerminal(this.grammar.start);
    if (node && this.pos === this.input.length) {
      return node;
    }
    return null;
  }

  /** Attempt to parse a non‑terminal by trying each of its productions in order. */
  private parseNonTerminal(name: string): ParseNode | null {
    const productions = this.grammar.rules[name];
    if (!productions) {
      throw new Error(`Undefined non‑terminal: ${name}`);
    }

    const startPos = this.pos;
    for (const prod of productions) {
      this.pos = startPos;
      const children: ParseNode[] = [];
      let ok = true;
      for (const sym of prod) {
        const child = this.parseSymbol(sym);
        if (child === null) {
          ok = false;
          break;
        }
        children.push(child);
      }
      if (ok) {
        return { name, children };
      }
    }
    this.pos = startPos;
    return null;
  }

  /** Parse a single symbol (terminal or non‑terminal). */
  private parseSymbol(sym: Symbol): ParseNode | null {
    if (sym.type === 'nonterminal') {
      return this.parseNonTerminal(sym.name);
    }
    // Terminal
    if (sym.type === 'literal') {
      if (this.input.startsWith(sym.value, this.pos)) {
        const node: ParseNode = { name: sym.value, text: sym.value };
        this.pos += sym.value.length;
        return node;
      }
      return null;
    }
    // regex terminal
    const regex = sym.pattern;
    const remaining = this.input.slice(this.pos);
    const match = regex.exec(remaining);
    if (match && match.index === 0) {
      const text = match[0];
      const node: ParseNode = { name: regex.source, text };
      this.pos += text.length;
      return node;
    }
    return null;
  }
}
