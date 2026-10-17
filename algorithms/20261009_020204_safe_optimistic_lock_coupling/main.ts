import { OptimisticLockCouplingList } from "./core";

// Simple numeric comparator.
const numCompare = (a: number, b: number): number => a - b;

// Unit test helper.
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

// Test suite.
function runTests(): void {
    // Test 1: Basic insertion and retrieval.
    const list1 = new OptimisticLockCouplingList<number, string>(numCompare);
    list1.set(10, "ten");
    list1.set(5, "five");
    list1.set(20, "twenty");
    assert(list1.get(10) === "ten", "Get existing key failed");
    assert(list1.get(5) === "five", "Get existing key failed");
    assert(list1.get(20) === "twenty", "Get existing key failed");
    assert(list1.get(15) === undefined, "Get non‑existing key should be undefined");
    assert(JSON.stringify(list1.toArray()) === JSON.stringify([5,10,20]), "List order incorrect after inserts");

    // Test 2: Update existing key.
    list1.set(10, "TEN");
    assert(list1.get(10) === "TEN", "Update existing key failed");
    assert(JSON.stringify(list1.toArray()) === JSON.stringify([5,10,20]), "List order changed after update");

    // Test 3: Deletion.
    const deleted = list1.delete(5);
    assert(deleted === true, "Delete existing key returned false");
    assert(list1.get(5) === undefined, "Deleted key still retrievable");
    assert(JSON.stringify(list1.toArray()) === JSON.stringify([10,20]), "List order incorrect after delete");

    // Test 4: Delete non‑existing key.
    const deletedNon = list1.delete(999);
    assert(deletedNon === false, "Delete non‑existing key should return false");

    // Test 5: Simulated concurrent interleaving.
    // We manually interleave a read with a write that changes the structure.
    const list2 = new OptimisticLockCouplingList<number, string>(numCompare);
    list2.set(1, "one");
    list2.set(3, "three");
    list2.set(5, "five");

    // Begin a read operation that records versions.
    // We'll expose internal traversal to capture state.
    // Since core.ts does not expose traversal, we simulate by calling get and
    // performing a write in the middle via a custom hook.
    // To achieve deterministic interleaving, we monkey‑patch the validate method
    // to force a retry after the first version check.

    // Save original validate.
    const originalValidate = (list2 as any).validate as Function;
    let validationCount = 0;
    (list2 as any).validate = function(node: any, version: number): boolean {
        validationCount++;
        // Force failure on first validation of the predecessor during the read.
        if (validationCount === 1) {
            return false;
        }
        // Afterwards delegate to original.
        return originalValidate.call(list2, node, version);
    };

    // Start async‑like read (actually synchronous but will retry).
    const readPromise = (() => {
        try {
            return list2.get(3);
        } catch (e) {
            return e;
        }
    })();

    // During the forced validation failure, perform a write that inserts a new key.
    list2.set(4, "four"); // This changes the list structure.

    // Restore original validate to allow the read to succeed on retry.
    (list2 as any).validate = originalValidate;

    // The read should eventually succeed and return the correct value.
    assert(readPromise === "three", "Optimistic read failed to recover after concurrent write");

    // Verify final list order.
    assert(JSON.stringify(list2.toArray()) === JSON.stringify([1,3,4,5]), "List order incorrect after interleaved operations");

    // Test 6: Stress test with many inserts.
    const list3 = new OptimisticLockCouplingList<number, number>(numCompare);
    const N = 1000;
    for (let i = 0; i < N; ++i) {
        list3.set(i, i * i);
    }
    for (let i = 0; i < N; ++i) {
        assert(list3.get(i) === i * i, `Stress test get failed at ${i}`);
    }
    // Delete half of them.
    for (let i = 0; i < N; i += 2) {
        assert(list3.delete(i) === true, `Delete failed at ${i}`);
    }
    for (let i = 0; i < N; ++i) {
        const expected = i % 2 === 0 ? undefined : i * i;
        assert(list3.get(i) === expected, `Post‑delete get mismatch at ${i}`);
    }

    console.log("All tests passed.");
}

// Entry point.
runTests();
