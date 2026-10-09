import { AVLTree, Comparator } from "./core";
import * as assert from "assert";

/** Simple numeric comparator */
const numComp: Comparator<number> = (a, b) => a - b;

/** Helper to build a tree from an array of [key,value] */
function buildTree(pairs: Array<[number, string]>): AVLTree<number, string> {
    const tree = new AVLTree<number, string>(numComp);
    for (const [k, v] of pairs) {
        tree.insert(k, v);
    }
    return tree;
}

/** Unit Tests ----------------------------------------------------------- */
function testInsertAndSearch(): void {
    const tree = new AVLTree<number, string>(numComp);
    tree.insert(10, "ten");
    tree.insert(20, "twenty");
    tree.insert(5, "five");
    assert.strictEqual(tree.find(10), "ten");
    assert.strictEqual(tree.find(5), "five");
    assert.strictEqual(tree.find(20), "twenty");
    assert.strictEqual(tree.find(99), undefined);
}

function testDuplicateKeyReplaces(): void {
    const tree = new AVLTree<number, string>(numComp);
    tree.insert(1, "one");
    tree.insert(1, "uno");
    assert.strictEqual(tree.find(1), "uno");
    assert.strictEqual(tree.inorder().length, 1);
}

function testRotations(): void {
    // LL rotation
    const ll = buildTree([[30, "a"], [20, "b"], [10, "c"]]);
    assert.deepStrictEqual(ll.inorder(), [[10, "c"], [20, "b"], [30, "a"]]);
    // RR rotation
    const rr = buildTree([[10, "a"], [20, "b"], [30, "c"]]);
    assert.deepStrictEqual(rr.inorder(), [[10, "a"], [20, "b"], [30, "c"]]);
    // LR rotation
    const lr = buildTree([[30, "a"], [10, "b"], [20, "c"]]);
    assert.deepStrictEqual(lr.inorder(), [[10, "b"], [20, "c"], [30, "a"]]);
    // RL rotation
    const rl = buildTree([[10, "a"], [30, "b"], [20, "c"]]);
    assert.deepStrictEqual(rl.inorder(), [[10, "a"], [20, "c"], [30, "b"]]);
    // Verify heights are logarithmic (max height <= 2 for 3 nodes)
    assert.ok(ll.height() <= 2 && rr.height() <= 2 && lr.height() <= 2 && rl.height() <= 2);
}

function testDeletion(): void {
    const tree = buildTree([
        [50, "a"], [30, "b"], [70, "c"], [20, "d"],
        [40, "e"], [60, "f"], [80, "g"]
    ]);
    // Delete leaf
    assert.strictEqual(tree.delete(20), true);
    assert.strictEqual(tree.find(20), undefined);
    // Delete node with one child
    assert.strictEqual(tree.delete(30), true);
    assert.strictEqual(tree.find(30), undefined);
    // Delete node with two children
    assert.strictEqual(tree.delete(70), true);
    assert.strictEqual(tree.find(70), undefined);
    // Remaining inorder should be sorted
    const expected = [
        [40, "e"], [50, "a"], [60, "f"], [80, "g"]
    ];
    assert.deepStrictEqual(tree.inorder(), expected);
    // Delete non‑existent key
    assert.strictEqual(tree.delete(999), false);
}

function testHeightInvariant(): void {
    const tree = new AVLTree<number, string>(numComp);
    const n = 1000;
    for (let i = 0; i < n; i++) {
        tree.insert(i, `v${i}`);
    }
    // Height of AVL tree with n nodes is <= 1.44*log2(n+2)-0.328
    const maxAllowed = Math.floor(1.44 * Math.log2(n + 2) - 0.328);
    assert.ok(tree.height() <= maxAllowed, `Height ${tree.height()} exceeds bound ${maxAllowed}`);
}

/** Execute all tests */
function runAll(): void {
    testInsertAndSearch();
    testDuplicateKeyReplaces();
    testRotations();
    testDeletion();
    testHeightInvariant();
    console.log("All AVLTree tests passed.");
}

runAll();
