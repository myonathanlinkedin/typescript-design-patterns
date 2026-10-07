export type TaskFn = (inputs: Record<string, any>) => Promise<any> | any;

export interface TaskDescriptor {
  id: string;
  deps?: string[];
  fn: TaskFn;
}

/**
 * Represents a single build task.
 */
export class Task {
  readonly id: string;
  readonly deps: string[];
  readonly fn: TaskFn;
  // Simple cache based on JSON stringified inputs
  private lastInputsHash?: string;
  private lastResult?: any;

  constructor(desc: TaskDescriptor) {
    this.id = desc.id;
    this.deps = desc.deps ?? [];
    this.fn = desc.fn;
  }

  /**
   * Executes the task if inputs changed, otherwise returns cached result.
   */
  async execute(inputs: Record<string, any>): Promise<any> {
    const hash = JSON.stringify(inputs);
    if (this.lastInputsHash === hash) {
      return this.lastResult;
    }
    const result = await this.fn(inputs);
    this.lastInputsHash = hash;
    this.lastResult = result;
    return result;
  }
}

/**
 * Holds a collection of tasks and resolves dependencies.
 */
export class BuildGraph {
  private tasks = new Map<string, Task>();

  addTask(desc: TaskDescriptor): void {
    if (this.tasks.has(desc.id)) {
      throw new Error(`Task with id "${desc.id}" already exists`);
    }
    this.tasks.set(desc.id, new Task(desc));
  }

  getTask(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task "${id}" not found`);
    return task;
  }

  /** Returns tasks in topological order; throws on cycles. */
  topologicalSort(): Task[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: Task[] = [];

    const visit = (id: string) => {
      if (temp.has(id)) throw new Error('Cyclic dependency detected');
      if (visited.has(id)) return;
      temp.add(id);
      const task = this.getTask(id);
      for (const dep of task.deps) visit(dep);
      temp.delete(id);
      visited.add(id);
      result.push(task);
    };

    for (const id of this.tasks.keys()) visit(id);
    return result;
  }
}

/**
 * Executes a BuildGraph respecting dependencies and optional parallelism.
 * After the first run, it can autotune the maxParallel based on observed timings.
 */
export class Scheduler {
  private graph: BuildGraph;
  private maxParallel: number;
  private timings = new Map<string, number>();
  private cpuCount: number;

  constructor(graph: BuildGraph, maxParallel = 2) {
    this.graph = graph;
    this.maxParallel = maxParallel;
    this.cpuCount = typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency
      ? (navigator as any).hardwareConcurrency
      : 4; // fallback
  }

  /** Runs all tasks and returns a map of task id → result. */
  async run(): Promise<Map<string, any>> {
    const sorted = this.graph.topologicalSort();
    const results = new Map<string, any>();
    const inProgress = new Set<string>();
    const readyQueue: Task[] = [];

    // Initialize ready queue with tasks whose deps are satisfied (none at start)
    for (const task of sorted) {
      if (task.deps.length === 0) readyQueue.push(task);
    }

    const scheduleNext = async (): Promise<void> => {
      if (readyQueue.length === 0) return;
      if (inProgress.size >= this.maxParallel) return;

      const task = readyQueue.shift()!;
      inProgress.add(task.id);
      const start = performance.now();

      // Gather inputs from dependencies
      const inputs: Record<string, any> = {};
      for (const dep of task.deps) {
        inputs[dep] = results.get(dep);
      }

      try {
        const res = await task.execute(inputs);
        const duration = performance.now() - start;
        this.timings.set(task.id, duration);
        results.set(task.id, res);
      } finally {
        inProgress.delete(task.id);
        // Enqueue dependents whose all deps are now satisfied
        for (const candidate of sorted) {
          if (results.has(candidate.id)) continue; // already done
          if (candidate.deps.every(d => results.has(d)) && !readyQueue.includes(candidate)) {
            readyQueue.push(candidate);
          }
        }
        // Continue scheduling
        await Promise.all(Array.from({ length: this.maxParallel }).map(scheduleNext));
      }
    };

    // Kick off parallel workers
    await Promise.all(Array.from({ length: this.maxParallel }).map(scheduleNext));

    return results;
  }

  /** Simple autotuning: adjust maxParallel based on average task duration. */
  autotune(): void {
    if (this.timings.size === 0) return;
    const avg = Array.from(this.timings.values()).reduce((a, b) => a + b, 0) / this.timings.size;
    // Heuristic: if avg < 50ms increase parallelism, else decrease (but stay >=1)
    if (avg < 50) {
      this.maxParallel = Math.min(this.cpuCount, this.maxParallel + 1);
    } else if (avg > 200) {
      this.maxParallel = Math.max(1, this.maxParallel - 1);
    }
  }

  /** Expose timings for testing/benchmarking. */
  getTimings(): Map<string, number> {
    return new Map(this.timings);
  }

  /** Current parallelism setting. */
  getParallelism(): number {
    return this.maxParallel;
  }
}
