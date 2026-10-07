import { Variable, Domain, BinaryConstraint, CSP } from "./types";
import { MaltsevSolver } from "./engine";

// Simple assertion helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Utility to create a binary constraint from a predicate over two values
function buildConstraint(
  var1: Variable,
  var2: Variable,
  domains: Map<Variable, Domain>,
  predicate: (a: number, b: number) => boolean
): BinaryConstraint {
  const allowed = new Set<string>();
  for (const a of domains.get(var1)!) {
    for (const b of domains.get(var2)!) {
      if (predicate(a, b)) {
        allowed.add(`${a},${b}`);
      }
    }
  }
  return { var1, var2, allowed };
}

// Equality constraint (a == b)
function equalityConstraint(v1: Variable, v2: Variable, domains: Map<Variable, Domain>): BinaryConstraint {
  return buildConstraint(v1, v2, domains, (a, b) => a === b);
}

// Disequality constraint (a != b)
function disequalityConstraint(v1: Variable, v2: Variable, domains: Map<Variable, Domain>): BinaryConstraint {
  return buildConstraint(v1, v2, domains, (a, b) => a !== b);
}

// Test 1: Simple equality chain (should be solvable)
function testEqualityChain(): void {
  const vars: Variable[] = ["a", "b", "c"];
  const domains = new Map<Variable, Domain>();
  for (const v of vars) {
    domains.set(v, new Set([0, 1]));
  }

  const constraints: BinaryConstraint[] = [
    equalityConstraint("a", "b", domains),
    equalityConstraint("b", "c", domains),
  ];

  const csp: CSP = { variables: vars, domains, constraints };
  const solver = new MaltsevSolver(csp);
  const solution = solver.solve();

  assert(solution !== null, "Equality chain should have a solution");
  const valA = solution!.get("a")!;
  const valB = solution!.get("b")!;
  const valC = solution!.get("c")!;
  assert(valA === valB && valB === valC, "All variables must be equal");
}

// Test 2: Equality + disequality conflict (unsatisfiable)
function testConflict(): void {
  const vars: Variable[] = ["x", "y", "z"];
  const domains = new Map<Variable, Domain>();
  for (const v of vars) {
    domains.set(v, new Set([0, 1]));
  }

  const constraints: BinaryConstraint[] = [
    equalityConstraint("x", "y", domains),
    equalityConstraint("y", "z", domains),
    disequalityConstraint("x", "z", domains),
  ];

  const csp: CSP = { variables: vars, domains, constraints };
  const solver = new MaltsevSolver(csp);
  const solution = solver.solve();

  assert(solution === null, "Conflict CSP should be unsatisfiable");
}

// Test 3: Single variable (trivial)
function testSingleVariable(): void {
  const vars: Variable[] = ["p"];
  const domains = new Map<Variable, Domain>();
  domains.set("p", new Set([42]));

  const csp: CSP = { variables: vars, domains, constraints: [] };
  const solver = new MaltsevSolver(csp);
  const solution = solver.solve();

  assert(solution !== null, "Single variable CSP should be solvable");
  assert(solution!.get("p") === 42, "Variable should take the only value in its domain");
}

// Run all tests
function runTests(): void {
  testEqualityChain();
  testConflict();
  testSingleVariable();
  console.log("All tests passed.");
}

// Demo: Solve a small CSP with a Maltsev-preserving relation (modular addition)
// Variables: u, v, w with domain {0,1,2}
// Constraint: u + v ≡ w (mod 3) expressed as binary constraints between each pair
function demoModularCSP(): void {
  const vars: Variable[] = ["u", "v", "w"];
  const domains = new Map<Variable, Domain>();
  for (const v of vars) {
    domains.set(v, new Set([0, 1, 2]));
  }

  // Helper to generate allowed pairs for the ternary relation projected onto a pair
  function projectionAllowed(a: number, b: number, thirdVar: Variable): boolean {
    // There exists c in domain such that a + b ≡ c (mod 3)
    // Since domain is complete modulo 3, this is always true.
    // For demonstration we keep the constraint non‑trivial by checking the actual equation.
    const c = (a + b) % 3;
    return domains.get(thirdVar)!.has(c);
  }

  const constraints: BinaryConstraint[] = [
    buildConstraint("u", "v", domains, (a, b) => projectionAllowed(a, b, "w")),
    buildConstraint("u", "w", domains, (a, c) => projectionAllowed(a, c, "v")),
    buildConstraint("v", "w", domains, (b, c) => projectionAllowed(b, c, "u")),
  ];

  const csp: CSP = { variables: vars, domains, constraints };
  const solver = new MaltsevSolver(csp);
  const solution = solver.solve();

  assert(solution !== null, "Modular CSP should have a solution");
  const u = solution!.get("u")!;
  const v = solution!.get("v")!;
  const w = solution!.get("w")!;
  assert((u + v) % 3 === w, "Solution must satisfy u + v ≡ w (mod 3)");
  console.log("Demo solution:", { u, v, w });
}

// Execute
runTests();
demoModularCSP();
