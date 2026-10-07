import { BuildGraph, Scheduler, TaskDescriptor } from "./core";

/* Simple assertion helper */
function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/* Sample tasks */
const tasks: TaskDescriptor[] = [
  {
    id: "clean",
    fn: async () => {
      // simulate quick work
      await new Promise(r => setTimeout(r, 10));
      return "cleaned";
    },
  },
  {
    id: "compile",
    deps: ["clean"],
    fn: async ({ clean }) => {
      await new Promise(r => setTimeout(r, 80));
      return `${clean}+compiled`;
    },
  },
  {
    id: "test",
    deps: ["compile"],
    fn: async ({ compile }) => {
      await new Promise(r => setTimeout(r, 120));
      return `${compile}+tested`;
    },
  },
  {
    id: "bundle",
    deps: ["compile"],
    fn: async ({ compile }) => {
      await new Promise(r => setTimeout(r, 60));
      return `${compile}+bundled`;
    },
  },
  {
    id: "deploy",
    deps: ["test", "bundle"],
    fn: async ({ test, bundle }) => {
      await new Promise(r => setTimeout(r, 30));
      return `${test}+${bundle}+deployed`;
    },
  },
];

/* Build graph construction */
const graph = new BuildGraph();
for (const t of tasks) graph.addTask(t);

/* Scheduler with initial parallelism */
const scheduler = new Scheduler(graph, 2);

/* Unit Tests */
(async () => {
  // 1. Basic run produces expected final result
  const results1 = await scheduler.run();
  assert(results1.get("deploy") === "cleaned+compiled+tested+cleaned+compiled+bundled+deployed",
    "Deploy result mismatch");

  // 2. Caching: re-running without changes should be fast and reuse results
  const start = performance.now();
  const results2 = await scheduler.run();
  const duration = performance.now() - start;
  // All tasks should have been cached; duration should be < 30ms
  assert(duration < 30, "Cached run took too long");

  // 3. Autotuning adjusts parallelism based on timings
  const before = scheduler.getParallelism();
  scheduler.autotune();
  const after = scheduler.getParallelism();
  // Since average task time > 50ms, parallelism should stay same or decrease
  assert(after <= before, "Autotune did not adjust parallelism correctly");

  // 4. Verify topological order respects dependencies (no cycles)
  const sorted = graph.topologicalSort().map(t => t.id);
  const index = (id: string) => sorted.indexOf(id);
  for (const t of tasks) {
    if (t.deps) {
      for (const d of t.deps) {
        assert(index(d) < index(t.id), `Dependency order violated for ${t.id}`);
      }
    }
  }

  console.log("All unit tests passed.");
})().catch(e => {
  console.error(e);
});

/* Demo run with timing output */
(async () => {
  const demoScheduler = new Scheduler(graph, 3);
  const results = await demoScheduler.run();
  console.log("Demo final result:", results.get("deploy"));
  console.log("Task timings (ms):");
  for (const [id, time] of demoScheduler.getTimings()) {
    console.log(`  ${id}: ${time.toFixed(2)}`);
  }
  console.log("Parallelism after run:", demoScheduler.getParallelism());
  demoScheduler.autotune();
  console.log("Parallelism after autotune:", demoScheduler.getParallelism());
})();
