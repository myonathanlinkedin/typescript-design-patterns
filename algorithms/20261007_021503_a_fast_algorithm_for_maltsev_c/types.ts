export type Variable = string;

export type Domain = Set<number>;

export interface BinaryConstraint {
  var1: Variable;
  var2: Variable;
  // allowed pairs encoded as "a,b"
  allowed: Set<string>;
}

export interface CSP {
  variables: Variable[];
  domains: Map<Variable, Domain>;
  constraints: BinaryConstraint[];
}
