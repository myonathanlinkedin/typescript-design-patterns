import { Player, PartitionResult, Team } from "./types";

/**
 * Returns a fair partition of the given players into two teams.
 * The algorithm finds a partition that minimises the absolute difference
 * between the total skill of the two teams while respecting team‑size constraints:
 *   - If the number of players is even, both teams have n/2 members.
 *   - If odd, one team has floor(n/2) members and the other ceil(n/2) members.
 *
 * Determinism:
 *   - When multiple optimal partitions exist, the one whose first team’s
 *     sorted list of names is lexicographically smallest is chosen.
 *
 * Time   : O(n * totalSkill * n) in the worst case (pseudo‑polynomial).
 * Space  : O(n * totalSkill) for DP tables.
 *
 * @param players List of players to split.
 * @returns PartitionResult containing both teams and the skill difference.
 */
export function pickFairTeams(players: Player[]): PartitionResult {
    const n = players.length;
    if (n === 0) {
        return { teamA: [], teamB: [], skillDifference: 0 };
    }

    const totalSkill = players.reduce((s, p) => s + p.skill, 0);
    const maxCount = Math.ceil(n / 2);

    // dp[count] = Map<sum, bitmask>
    const dp: Array<Map<number, bigint>> = Array.from({ length: maxCount + 1 }, () => new Map());
    dp[0].set(0, 0n); // empty set

    for (let idx = 0; idx < n; idx++) {
        const skill = players[idx].skill;
        // iterate counts descending to avoid re‑using the same player
        for (let cnt = Math.min(idx, maxCount - 1); cnt >= 0; cnt--) {
            const curMap = dp[cnt];
            const nextMap = dp[cnt + 1];
            for (const [sum, mask] of curMap.entries()) {
                const newSum = sum + skill;
                const newMask = mask | (1n << BigInt(idx));
                // Keep the first encountered mask for a given sum (deterministic)
                if (!nextMap.has(newSum)) {
                    nextMap.set(newSum, newMask);
                }
            }
        }
    }

    // Helper to extract a team from a bitmask
    const maskToTeam = (mask: bigint): Team => {
        const team: Player[] = [];
        for (let i = 0; i < n; i++) {
            if ((mask >> BigInt(i)) & 1n) {
                team.push(players[i]);
            }
        }
        return team;
    };

    // Determine which team sizes are admissible
    const sizeOptions = n % 2 === 0 ? [n / 2] : [Math.floor(n / 2), Math.ceil(n / 2)];

    let bestResult: PartitionResult | null = null;

    for (const size of sizeOptions) {
        const sumMap = dp[size];
        for (const [sum, mask] of sumMap.entries()) {
            const diff = Math.abs(totalSkill - 2 * sum);
            const teamA = maskToTeam(mask);
            const teamB = players.filter(p => !teamA.includes(p));

            // Sort names for deterministic tie‑breaking
            const sortedA = [...teamA].map(p => p.name).sort();
            const sortedB = [...teamB].map(p => p.name).sort();

            const candidate: PartitionResult = {
                teamA: teamA,
                teamB: teamB,
                skillDifference: diff,
            };

            if (bestResult === null) {
                bestResult = candidate;
                continue;
            }

            if (diff < bestResult.skillDifference) {
                bestResult = candidate;
                continue;
            }

            if (diff === bestResult.skillDifference) {
                // Lexicographic comparison of sorted name arrays
                const aNames = sortedA;
                const bNames = bestResult.teamA.map(p => p.name).sort();
                const compare = lexicographicCompare(aNames, bNames);
                if (compare < 0) {
                    bestResult = candidate;
                }
            }
        }
    }

    // Fallback (should never happen)
    if (bestResult === null) {
        throw new Error("Failed to compute a partition.");
    }

    return bestResult;
}

/**
 * Lexicographically compares two string arrays.
 * Returns -1 if a < b, 1 if a > b, 0 if equal.
 */
function lexicographicCompare(a: string[], b: string[]): number {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
    }
    if (a.length < b.length) return -1;
    if (a.length > b.length) return 1;
    return 0;
}
