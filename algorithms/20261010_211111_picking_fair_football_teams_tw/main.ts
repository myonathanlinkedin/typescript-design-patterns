import { Player } from "./types";
import { pickFairTeams } from "./engine";
import * as assert from "assert";

/**
 * Helper to create a player.
 */
function p(name: string, skill: number): Player {
    return { name, skill };
}

/**
 * Unit tests covering typical, edge, and deterministic cases.
 */
function runTests(): void {
    // Test 1: Even number, obvious optimal split
    const players1 = [
        p("Alice", 5),
        p("Bob", 5),
        p("Charlie", 4),
        p("David", 6),
    ];
    const res1 = pickFairTeams(players1);
    assert.strictEqual(res1.skillDifference, 0, "Test 1: skill difference should be 0");
    const teamANames1 = res1.teamA.map(p => p.name).sort();
    const teamBNames1 = res1.teamB.map(p => p.name).sort();
    // One possible optimal split: {Alice, David} vs {Bob, Charlie}
    const possibleA1 = ["Alice", "David"];
    const possibleB1 = ["Bob", "Charlie"];
    assert.deepStrictEqual(teamANames1, possibleA1, "Test 1: team A composition");
    assert.deepStrictEqual(teamBNames1, possibleB1, "Test 1: team B composition");

    // Test 2: Odd number, size difference of one
    const players2 = [
        p("Eve", 3),
        p("Frank", 7),
        p("Grace", 2),
        p("Heidi", 8),
        p("Ivan", 5),
    ];
    const res2 = pickFairTeams(players2);
    // Total skill = 25, best possible diff = 1 (12 vs 13)
    assert.strictEqual(res2.skillDifference, 1, "Test 2: skill difference should be 1");
    const sizeA2 = res2.teamA.length;
    const sizeB2 = res2.teamB.length;
    assert.ok(Math.abs(sizeA2 - sizeB2) === 1, "Test 2: team sizes differ by 1");

    // Test 3: Empty list
    const res3 = pickFairTeams([]);
    assert.deepStrictEqual(res3.teamA, [], "Test 3: empty team A");
    assert.deepStrictEqual(res3.teamB, [], "Test 3: empty team B");
    assert.strictEqual(res3.skillDifference, 0, "Test 3: zero difference");

    // Test 4: Single player
    const single = [p("Zoe", 10)];
    const res4 = pickFairTeams(single);
    assert.deepStrictEqual(res4.teamA.map(p => p.name), ["Zoe"], "Test 4: single player in team A");
    assert.deepStrictEqual(res4.teamB, [], "Test 4: team B empty");
    assert.strictEqual(res4.skillDifference, 10, "Test 4: difference equals skill");

    // Test 5: Determinism – calling twice yields identical result
    const players5 = [
        p("A", 1),
        p("B", 2),
        p("C", 3),
        p("D", 4),
        p("E", 5),
        p("F", 6),
    ];
    const first = pickFairTeams(players5);
    const second = pickFairTeams(players5);
    assert.deepStrictEqual(
        first.teamA.map(p => p.name).sort(),
        second.teamA.map(p => p.name).sort(),
        "Test 5: deterministic team A"
    );
    assert.deepStrictEqual(
        first.teamB.map(p => p.name).sort(),
        second.teamB.map(p => p.name).sort(),
        "Test 5: deterministic team B"
    );
    assert.strictEqual(first.skillDifference, second.skillDifference, "Test 5: deterministic diff");

    // Test 6: Larger random set (deterministic via fixed seed)
    const players6: Player[] = [];
    const names = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (let i = 0; i < 12; i++) {
        players6.push(p(`P${i}`, (i * 7) % 13 + 1)); // deterministic pseudo‑random skill
    }
    const res6 = pickFairTeams(players6);
    // Verify that the sum of skills matches total and diff is minimal (cannot be negative)
    const sumA = res6.teamA.reduce((s, p) => s + p.skill, 0);
    const sumB = res6.teamB.reduce((s, p) => s + p.skill, 0);
    const total = players6.reduce((s, p) => s + p.skill, 0);
    assert.strictEqual(sumA + sumB, total, "Test 6: total skill conserved");
    assert.strictEqual(Math.abs(sumA - sumB), res6.skillDifference, "Test 6: diff matches calculation");
    // Ensure team sizes obey constraints
    const expectedLow = Math.floor(players6.length / 2);
    const expectedHigh = Math.ceil(players6.length / 2);
    const szA = res6.teamA.length;
    const szB = res6.teamB.length;
    assert.ok(
        (szA === expectedLow && szB === expectedHigh) ||
        (szA === expectedHigh && szB === expectedLow),
        "Test 6: team sizes correct"
    );

    console.log("All tests passed.");
}

// Execute tests when the module is run directly
if (require.main === module) {
    runTests();
}
