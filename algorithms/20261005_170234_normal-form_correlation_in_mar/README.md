# Normal-Form Correlation in Markov Games

A clean, dependency-free **TypeScript** implementation of **Normal-Form Correlation in Markov Games**, focused on predictable latency, strict memory layout, and deterministic execution.

### Core Highlights
* **Language & Standard**: Modern `TypeScript` standard library conventions.
* **Architecture Pattern**: Designed for `Algorithmic Engineering` using `Standard Memory Primitives`.
* **Runtime Overhead**: Contiguous memory layouts are favored over scattered heap allocations for optimal traversal speed.
* **Concurrency & Safety**: Designed with reentrancy and thread isolation in mind, preventing data races under parallel workloads.

---

### Complexity Analysis

| Dimension | Bound |
| :--- | :--- |
| **Time (Best Case)** | `$O(1)$` |
| **Time (Worst Case)** | `$O(N \log N)$` |
| **Auxiliary Space** | `$O(N)$` |

---

### Test Suite Execution

Self-contained verification drivers are embedded directly in `main.ts` to validate happy paths, boundary inputs, and invariant preservation.

```bash
npx ts-node main.ts
```

---

*Source code released under the MIT License • [@myonathanlinkedin](https://github.com/myonathanlinkedin)*