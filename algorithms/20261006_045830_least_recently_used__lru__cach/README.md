# Least Recently Used (LRU) Cache with Doubly Linked List

Modern **TypeScript** reference architecture for **Least Recently Used (LRU) Cache with Doubly Linked List**. Engineered for rigorous algorithmic correctness, high throughput, and bounded memory utilization.

---

## 🏛️ Architecture & Design Decisions

This module organizes `Least Recently Used (LRU) Cache with Doubly Linked List` into an isolated, self-contained unit:
* **Domain Focus**: `Low-Latency Systems & Memory Layout`
* **Primary Primitives**: `Contiguous Memory Buffer & Ring Pointers`
* **Memory Strategy**: Buffer boundaries are strictly verified to prevent out-of-bounds access and memory leak hazards.
* **Correctness Model**: State transitions adhere to strict ordering guarantees with explicit synchronization fences where necessary.

### Asymptotic Complexity

| Metric | Bound | Characteristics |
| :--- | :---: | :--- |
| **Best Case Time** | `$O(1)$` | Optimized fast-path execution |
| **Average / Worst Time** | `$O(1)$` | Deterministic upper bound for generalized workloads |
| **Space Complexity** | `$O(N) bounded$` | Strict bounds without unconstrained heap growth |

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

<sub>Crafted with modern TypeScript standards • Maintained by [@myonathanlinkedin](https://github.com/myonathanlinkedin)</sub>