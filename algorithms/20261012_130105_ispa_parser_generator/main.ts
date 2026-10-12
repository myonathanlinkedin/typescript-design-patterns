import { Parser, Grammar, Symbol } from './core.ts';

/** Minimal assertion helper */
function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message ?? 'Assertion failed');
  }
}

/** Helper to create terminal symbols */
function lit(s: string): Symbol {
  return { type: 'literal', value: s };
}
function regex(p: RegExp): Symbol {
  return { type: 'regex', pattern: p };
}
function nt(name: string): Symbol {
  return { type: 'nonterminal', name };
}

/** Build a grammar for simple arithmetic expressions with correct precedence. */
const arithmeticGrammar: Grammar = {
  start: 'Expr',
  rules: {
    Expr: [
      // Expr -> Term ((+|-) Term)*
      [nt('Term'), nt('ExprTail')],
    ],
    ExprTail: [
      // ExprTail -> (+ Term ExprTail) | (- Term ExprTail) | ε
      [lit('+'), nt('Term'), nt('ExprTail')],
      [lit('-'), nt('Term'), nt('ExprTail')],
      [], // epsilon
    ],
    Term: [
      // Term -> Factor (( * | / ) Factor)*
      [nt('Factor'), nt('TermTail')],
    ],
    TermTail: [
      // TermTail -> (* Factor TermTail) | (/ Factor TermTail) | ε
      [lit('*'), nt('Factor'), nt('TermTail')],
      [lit('/'), nt('Factor'), nt('TermTail')],
      [], // epsilon
    ],
    Factor: [
      // Factor -> ( Expr ) | Number
      [lit('('), nt('Expr'), lit(')')],
      [nt('Number')],
    ],
    Number: [
      // Number -> /\d+/
      [regex(/\d+/)],
    ],
  },
};

/** Pretty‑print a parse tree for debugging */
function treeToString(node: any, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (node.text !== undefined) {
    return `${pad}${node.name}: "${node.text}"\n`;
  }
  const children = node.children?.map((c: any) => treeToString(c, indent + 1)).join('') ?? '';
  return `${pad}${node.name}\n${children}`;
}

/** Unit tests */
function runTests(): void {
  const parser = new Parser(arithmeticGrammar);

  // Test 1: simple number
  const n1 = parser.parse('42');
  assert(n1 !== null, 'Failed to parse number');
  assert(n1!.name === 'Expr', 'Root should be Expr');
  // The tree should contain a Number node with text '42'
  const numNode = findNode(n1!, 'Number');
  assert(numNode !== null && numNode.text === '42', 'Number node missing or incorrect');

  // Test 2: addition and multiplication precedence
  const expr = '2+3*4';
  const tree = parser.parse(expr);
  assert(tree !== null, `Failed to parse "${expr}"`);
  // The root Expr should have left Term = Number(2) and right ExprTail = '+ Term ExprTail'
  const plusNode = findNode(tree!, '+');
  assert(plusNode !== null, 'Missing plus operator node');

  // Ensure multiplication is nested inside the right Term, not left
  const mulNode = findNode(tree!, '*');
  assert(mulNode !== null, 'Missing multiplication operator node');
  const mulParent = mulNode!.parent;
  assert(mulParent?.name === 'TermTail', 'Multiplication should be inside TermTail');

  // Test 3: parentheses override precedence
  const expr2 = '(1+2)*3';
  const tree2 = parser.parse(expr2);
  assert(tree2 !== null, `Failed to parse "${expr2}"`);
  const mulNode2 = findNode(tree2!, '*');
  assert(mulNode2 !== null, 'Missing multiplication in parentheses test');
  const plusNode2 = findNode(tree2!, '+');
  assert(plusNode2 !== null, 'Missing plus inside parentheses');

  // Test 4: invalid input should return null
  const bad = parser.parse('2+*3');
  assert(bad === null, 'Parser should reject malformed expression');

  console.log('All tests passed.');
}

/** Helper to locate a node by its name (terminal literal or non‑terminal). */
function findNode(root: any, targetName: string, parent: any = null): any | null {
  if (root.name === targetName) {
    root.parent = parent; // attach for parent checks
    return root;
  }
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, targetName, root);
      if (found) return found;
    }
  }
  return null;
}

/** Execute tests when this module is run directly */
if (import.meta.main) {
  runTests();
}

// End of file.
