import { InMemoryGrainRuntime, CounterGrain } from "./engine";

function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

(async () => {
  const runtime = new InMemoryGrainRuntime();

  const grainA = runtime.getGrain(CounterGrain, "grain-1");
  const grainB = runtime.getGrain(CounterGrain, "grain-2");

  // Initial state checks
  let countA = await grainA.getCount();
  let countB = await grainB.getCount();
  assert(countA === 0, "Initial count A should be 0");
  assert(countB === 0, "Initial count B should be 0");

  // Perform operations
  await grainA.increment(5);
  await grainB.increment(3);
  await grainA.increment();

  countA = await grainA.getCount();
  countB = await grainB.getCount();

  assert(countA === 6, "Grain A count should be 6");
  assert(countB === 3, "Grain B count should be 3");

  // Re-fetch same grain and verify state persistence
  const grainA2 = runtime.getGrain(CounterGrain, "grain-1");
  const countA2 = await grainA2.getCount();
  assert(countA2 === 6, "Re-fetched Grain A should retain state");

  console.log("All Orleans‑like grain tests passed.");
})().catch(err => {
  console.error("Test failure:", err);
  process.exit(1);
});
