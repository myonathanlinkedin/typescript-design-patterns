import { LSMTree } from "./core.ts";

/** Simple assertion helper. */
function assert(condition: boolean, msg?: string): void {
  if (!condition) throw new Error(msg ?? "Assertion failed");
}

/** Run all unit tests. */
function runTests(): void {
  // Test 1: basic put/get without flush
  const tree1 = new LSMTree(10);
  tree1.put("a", "1");
  tree1.put("b", "2");
  assert(tree1.get("a") === "1", "Test1 a");
  assert(tree1.get("b") === "2", "Test1 b");
  assert(tree1.get("c") === undefined, "Test1 missing");

  // Test 2: automatic flush on threshold
  const tree2 = new LSMTree(2, 5);
  tree2.put("x", "10");
  tree2.put("y", "20"); // triggers flush
  assert(tree2.sstableCount() === 1, "Test2 flush count");
  assert(tree2.get("x") === "10", "Test2 read after flush");
  tree2.put("z", "30");
  assert(tree2.get("z") === "30", "Test2 recent write");

  // Test 3: overwrite key across memtable and sstable
  const tree3 = new LSMTree(2, 5);
  tree3.put("k", "v1");
  tree3.put("k", "v2"); // flushes, latest seq in memtable
  assert(tree3.get("k") === "v2", "Test3 overwrite");
  tree3.flush(); // move latest to sstable
  assert(tree3.get("k") === "v2", "Test3 after explicit flush");

  // Test 4: compaction merges duplicates correctly
  const tree4 = new LSMTree(2, 2); // compaction after 3 tables
  tree4.put("a", "1"); // flush 1
  tree4.put("b", "2"); // flush 2
  tree4.put("a", "3"); // flush 3 -> triggers compaction
  assert(tree4.sstableCount() === 1, "Test4 compaction count");
  // After compaction, key "a" should have newest value "3"
  assert(tree4.get("a") === "3", "Test4 newest a");
  // Key "b" should still be present
  assert(tree4.get("b") === "2", "Test4 b preserved");

  // Test 5: large number of sequential inserts
  const N = 100;
  const tree5 = new LSMTree(15, 4);
  for (let i = 0; i < N; i++) {
    tree5.put(`k${i}`, `v${i}`);
  }
  // Verify random sampling
  for (let i = 0; i < N; i += 13) {
    assert(tree5.get(`k${i}`) === `v${i}`, `Test5 key ${i}`);
  }
  // Ensure all entries are present after final flush
  tree5.flush();
  for (let i = 0; i < N; i++) {
    assert(tree5.get(`k${i}`) === `v${i}`, `Test5 final ${i}`);
  }

  console.log("All tests passed.");
}

/** Entry point. */
runTests();
