# The Plan Language of a Curriculum: A Formal Model and the Complexity of Degree Planning

An in-memory reference implementation of **The Plan Language of a Curriculum: A Formal Model and the Complexity of Degree Planning** in **TypeScript**, adhering to standard library idioms, clean data structures, and assertion test suites.

### Core Highlights
* **Language & Standard**: Modern `TypeScript` standard library conventions.
* **Architecture Pattern**: Designed for `Algorithmic Engineering` using `Standard Memory Primitives`.
* **Runtime Overhead**: Zero external heap dependencies; designed as a pure in-memory algorithmic component.
* **Concurrency & Safety**: Encapsulates state within isolated data structures, keeping logic self-contained.

---

### Complexity Analysis

| Dimension | Bound |
| :--- | :--- |
| **Time (Best Case)** | `O(1)` |
| **Time (Worst Case)** | `O(N log N)` |
| **Auxiliary Space** | `O(N)` |

---

### Test Suite Execution

Self-contained verification drivers are embedded directly in `main.ts` to validate happy paths, boundary inputs, and invariant preservation.

```bash
npx ts-node main.ts
```

---

*Part of the Polyglot Systems Lab • Maintained by [@myonathanlinkedin](https://github.com/myonathanlinkedin)*
