import { Table, MaterializedView } from './core';

// Simple assertion helper
function assert(condition: any, message?: string): void {
  if (!condition) {
    throw new Error(message ?? 'Assertion failed');
  }
}

// Test suite
function runTests(): void {
  // Define a user type
  type User = { id: number; name: string; age: number; active: boolean };

  // Create a table
  const users = new Table<User>();

  // Insert initial rows
  users.insert({ id: 1, name: 'Alice', age: 30, active: true });
  users.insert({ id: 2, name: 'Bob', age: 25, active: false });
  users.insert({ id: 3, name: 'Carol', age: 35, active: true });

  // View: average age of all users
  const avgAgeView = new MaterializedView<User, number>(users, rows => {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((a, r) => a + r.age, 0);
    return sum / rows.length;
  });

  assert(avgAgeView.getValue() === (30 + 25 + 35) / 3, 'Initial average age incorrect');

  // Update a user's age and verify view updates
  users.update(2, { age: 27 });
  assert(avgAgeView.getValue() === (30 + 27 + 35) / 3, 'Average age after update incorrect');

  // Delete a user and verify view updates
  users.delete(1);
  assert(avgAgeView.getValue() === (27 + 35) / 2, 'Average age after delete incorrect');

  // View: list of active user names
  const activeNamesView = new MaterializedView<User, string[]>(users, rows =>
    rows.filter(r => r.active).map(r => r.name)
  );

  assert(
    JSON.stringify(activeNamesView.getValue()) === JSON.stringify(['Carol']),
    'Active names after deletions incorrect'
  );

  // Insert a new active user
  users.insert({ id: 4, name: 'Dave', age: 40, active: true });
  assert(
    JSON.stringify(activeNamesView.getValue().sort()) === JSON.stringify(['Carol', 'Dave'].sort()),
    'Active names after insertion incorrect'
  );

  // Subscribe to view changes
  let notified = false;
  avgAgeView.subscribe(v => {
    notified = true;
    assert(v === (27 + 35 + 40) / 3, 'Subscribed average age value incorrect');
  });
  users.update(3, { age: 36 });
  assert(notified, 'Subscriber was not notified on change');

  console.log('All tests passed.');
}

// Simple benchmark (optional)
function runBenchmark(): void {
  const N = 100_000;
  type Item = { id: number; value: number };
  const table = new Table<Item>();
  console.time('Insert');
  for (let i = 0; i < N; i++) {
    table.insert({ id: i, value: i });
  }
  console.timeEnd('Insert');

  const sumView = new MaterializedView<Item, number>(table, rows =>
    rows.reduce((a, r) => a + r.value, 0)
  );

  console.time('Update');
  for (let i = 0; i < N; i++) {
    table.update(i, { value: i * 2 });
  }
  console.timeEnd('Update');

  console.time('Recompute');
  // Force recompute by accessing value (already recomputed on each update)
  const total = sumView.getValue();
  console.timeEnd('Recompute');
  console.log('Final sum (should be N*(N-1)):', total);
}

// Entry point
function main(): void {
  runTests();
  runBenchmark();
}

main();
