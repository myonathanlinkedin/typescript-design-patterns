# What Actually Happens During Garbage Collection: Tri-Color Marking, Write Barriers, and

A clean, dependency-free **TypeScript** reference implementation of **What Actually Happens During Garbage Collection: Tri-Color Marking, Write Barriers, and**, focused on core algorithmic mechanics, clear memory layout, and test verification.

---

## 🏛️ Architecture & Design Decisions

This module organizes `What Actually Happens During Garbage Collection: Tri-Color Marking, Write Barriers, and` into an isolated, self-contained unit:
* **Domain Focus**: `Algorithmic Engineering`
* **Primary Primitives**: `Standard Memory Primitives`
* **Memory Strategy**: Buffer boundaries and collection indices are explicitly validated to prevent out-of-bounds access.
* **Correctness Model**: Encapsulates state within isolated data structures, keeping logic self-contained.

### Asymptotic Complexity

| Metric | Bound | Characteristics |
| :--- | :---: | :--- |
| **Best Case Time** | `O(1)` | Optimized fast-path execution |
| **Average / Worst Time** | `O(N)` | Deterministic upper bound for generalized workloads |
| **Space Complexity** | `O(N)` | Strict bounds without unconstrained heap growth |

---

## 🧪 Verification Suite

The accompanying `main.ts` driver executes self-contained verification tests:
1. **Nominal Flow**: Validates baseline correctness under typical real-world inputs.
2. **Boundary Conditions**: Exercises extreme edge cases (empty inputs, singletons, capacity limits).
3. **Invariant Preservation**: Validates internal state consistency throughout mutation lifecycles.

### Running Locally

```bash
npx ts-node main.ts
```

---

*Reference implementation verified by [@myonathanlinkedin](https://github.com/myonathanlinkedin)*