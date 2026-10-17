import { AVLTree } from "./core";

function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// Helper to generate a shuffled array of numbers 1..n
function shuffledRange(n: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---------- Unit Tests ----------
(function runTests() {
    // Test 1: Basic insertion and inorder traversal
    const tree1 = new AVLTree<number, string>();
    const keys = shuffledRange(10);
    for (const k of keys) {
        tree1.insert(k, `val${k}`);
    }
    const inorder = tree1.inorder().map(p => p.key);
    assert(JSON.stringify(inorder) === JSON.stringify([1,2,3,4,5,6,7,8,9,10]), "Inorder traversal failed");

    // Test 2: Find existing and missing keys
    assert(tree1.find(5) === "val5", "Find existing key failed");
    assert(tree1.find(11) === undefined, "Find missing key failed");

    // Test 3: Duplicate insertion updates value
    tree1.insert(5, "new5");
    assert(tree1.find(5) === "new5", "Duplicate insert update failed");

    // Test 4: Deletion of leaf, node with one child, node with two children
    const tree2 = new AVLTree<number, number>();
    const seq = [20, 4, 26, 3, 9, 15];
    for (const v of seq) tree2.insert(v, v);
    assert(tree2.delete(3) === true, "Delete leaf failed");
    assert(tree2.find(3) === undefined, "Deleted leaf still found");
    assert(tree2.delete(26) === true, "Delete node with one child failed");
    assert(tree2.find(26) === undefined, "Deleted node still found");
    assert(tree2.delete(4) === true, "Delete node with two children failed");
    assert(tree2.find(4) === undefined, "Deleted node still found");
    const remaining = tree2.inorder().map(p => p.key);
    assert(JSON.stringify(remaining) === JSON.stringify([9,15,20]), "Tree state after deletions incorrect");

    // Test 5: Height bound verification (AVL property)
    const tree3 = new AVLTree<number, number>();
    const N = 1000;
    const bigKeys = shuffledRange(N);
    for (const k of bigKeys) tree3.insert(k, k);
    const h = tree3.height();
    const bound = Math.ceil(1.44 * Math.log2(N + 2));
    assert(h <= bound, `Height bound violated: height=${h}, bound=${bound}`);

    // Test 6: Empty tree behaviours
    const empty = new AVLTree<number, string>();
    assert(empty.size() === 0, "Empty size not zero");
    assert(empty.height() === 0, "Empty height not zero");
    assert(empty.find(1) === undefined, "Find on empty tree failed");
    assert(empty.delete(1) === false, "Delete on empty tree should return false");

    console.log("All unit tests passed.");
})();

// ---------- Simple Benchmark ----------
(function benchmark() {
    const ITER = 20000;
    const benchTree = new AVLTree<number, number>();
    const keys = shuffledRange(ITER);
    const startInsert = Date.now();
    for (const k of keys) benchTree.insert(k, k);
    const endInsert = Date.now();

    const delKeys = keys.slice(0, ITER / 2);
    const startDelete = Date.now();
    for (const k of delKeys) benchTree.delete(k);
    const endDelete = Date.now();

    console.log(`Benchmark (n=${ITER}):`);
    console.log(`  Insert time: ${endInsert - startInsert} ms`);
    console.log(`  Delete time (half): ${endDelete - startDelete} ms`);
    console.log(`  Final size: ${benchTree.size()}`);
    console.log(`  Final height: ${benchTree.height()}`);
})();
