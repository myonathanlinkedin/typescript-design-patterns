import { CSP, Variable, Domain, BinaryConstraint } from "./types";

export class MaltsevSolver {
  private readonly csp: CSP;

  constructor(csp: CSP) {
    this.csp = csp;
  }

  public solve(): Map<Variable, number> | null {
    // Clone domains to avoid mutating the original CSP
    const domains = new Map<Variable, Domain>();
    for (const [v, d] of this.csp.domains) {
      domains.set(v, new Set(d));
    }

    if (!this.ac3(domains)) {
      return null;
    }

    return this.backtrack(domains, new Map());
  }

  // Arc Consistency (AC-3)
  private ac3(domains: Map<Variable, Domain>): boolean {
    const queue: Array<[Variable, Variable, BinaryConstraint]> = [];

    for (const cons of this.csp.constraints) {
      queue.push([cons.var1, cons.var2, cons]);
      queue.push([cons.var2, cons.var1, cons]);
    }

    while (queue.length > 0) {
      const [xi, xj, cons] = queue.shift()!;
      if (this.revise(domains, xi, xj, cons)) {
        if (domains.get(xi)!.size === 0) {
          return false;
        }
        for (const c of this.csp.constraints) {
          if (c.var1 === xi && c.var2 !== xj) {
            queue.push([c.var2, xi, c]);
          } else if (c.var2 === xi && c.var1 !== xj) {
            queue.push([c.var1, xi, c]);
          }
        }
      }
    }
    return true;
  }

  // Revise xi's domain with respect to xj
  private revise(
    domains: Map<Variable, Domain>,
    xi: Variable,
    xj: Variable,
    cons: BinaryConstraint
  ): boolean {
    let revised = false;
    const di = domains.get(xi)!;
    const dj = domains.get(xj)!;
    const toRemove: number[] = [];

    for (const a of di) {
      let hasSupport = false;
      for (const b of dj) {
        const pair =
          cons.var1 === xi ? `${a},${b}` : `${b},${a}`;
        if (cons.allowed.has(pair)) {
          hasSupport = true;
          break;
        }
      }
      if (!hasSupport) {
        toRemove.push(a);
        revised = true;
      }
    }

    for (const v of toRemove) {
      di.delete(v);
    }
    return revised;
  }

  // Simple backtracking with forward checking (using AC-3 after each assignment)
  private backtrack(
    domains: Map<Variable, Domain>,
    assignment: Map<Variable, number>
  ): Map<Variable, number> | null {
    if (assignment.size === this.csp.variables.length) {
      return assignment;
    }

    // Choose unassigned variable with smallest domain (MRV heuristic)
    let varSelect: Variable | null = null;
    let minSize = Infinity;
    for (const v of this.csp.variables) {
      if (!assignment.has(v)) {
        const size = domains.get(v)!.size;
        if (size < minSize) {
          minSize = size;
          varSelect = v;
        }
      }
    }

    if (varSelect === null) {
      return null;
    }

    const domainVals = Array.from(domains.get(varSelect)!);
    for (const val of domainVals) {
      const newAssign = new Map(assignment);
      newAssign.set(varSelect, val);

      // Clone domains for forward checking
      const newDomains = new Map<Variable, Domain>();
      for (const [k, d] of domains) {
        newDomains.set(k, new Set(d));
      }
      // Assign the chosen value
      newDomains.set(varSelect, new Set([val]));

      if (this.ac3(newDomains)) {
        const result = this.backtrack(newDomains, newAssign);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }
}
