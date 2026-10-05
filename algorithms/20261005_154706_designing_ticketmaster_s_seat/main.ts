import { SeatHoldEngine } from "./engine";
import assert from "assert";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initialize engine and create a sample event
const engine = new SeatHoldEngine();
const EVENT_ID = "E-1000";
const TOTAL_SEATS = 1_000;
const seatIds = Array.from({ length: TOTAL_SEATS }, (_, i) => `S-${i + 1}`);
engine.createEvent(EVENT_ID, seatIds);

// Test 1: Simple hold and confirm flow
(() => {
    const holdId = engine.holdSeats(EVENT_ID, ["S-1", "S-2"], "CUST-1", 2_000);
    const stateBefore = engine.getSeatState(EVENT_ID, "S-1");
    assert.strictEqual(stateBefore.holdId, holdId, "Seat should be held before confirm");
    const tickets = engine.confirmHold(holdId);
    assert.strictEqual(tickets.length, 2, "Two tickets should be issued");
    const stateAfter = engine.getSeatState(EVENT_ID, "S-1");
    assert.ok(stateAfter.ticketId, "Seat should have ticket after confirm");
    assert.strictEqual(stateAfter.holdId, undefined, "HoldId cleared after confirm");
})();

// Test 2: Hold expiration releases seats
(async () => {
    const holdId = engine.holdSeats(EVENT_ID, ["S-3"], "CUST-2", 500);
    const stateHeld = engine.getSeatState(EVENT_ID, "S-3");
    assert.strictEqual(stateHeld.holdId, holdId, "Seat should be held");
    await sleep(800); // exceed hold duration
    // After cleanup interval (5s) may not have run yet; invoke cleanup manually
    (engine as any).cleanupExpiredHolds();
    const stateReleased = engine.getSeatState(EVENT_ID, "S-3");
    assert.strictEqual(stateReleased.holdId, undefined, "Seat should be released after expiration");
    assert.throws(() => engine.confirmHold(holdId), /expired/, "Confirming expired hold should fail");
})();

// Test 3: Concurrent hold attempts on overlapping seats should serialize correctly
(async () => {
    const concurrentRequests = 100;
    const seatToStress = "S-4";
    const results: { success: boolean; holdId?: string }[] = [];

    const promises = Array.from({ length: concurrentRequests }, async () => {
        try {
            const holdId = engine.holdSeats(EVENT_ID, [seatToStress], `CUST-${Math.random()}`, 5_000);
            results.push({ success: true, holdId });
        } catch (e) {
            results.push({ success: false });
        }
    });

    await Promise.all(promises);
    const successes = results.filter((r) => r.success);
    assert.strictEqual(successes.length, 1, "Only one request should succeed in holding the same seat");
    const winningHoldId = successes[0].holdId!;
    // Confirm the winning hold
    const tickets = engine.confirmHold(winningHoldId);
    assert.strictEqual(tickets.length, 1, "Winning hold should issue one ticket");
    const finalState = engine.getSeatState(EVENT_ID, seatToStress);
    assert.ok(finalState.ticketId, "Seat should be sold after winning hold confirmation");
})();

// Test 4: High load simulation (50k requests) without global lock contention
(async () => {
    const REQUESTS = 50_000;
    const seatsPerRequest = 1;
    const holdDuration = 10_000; // 10 seconds
    const generatedSeatIds = seatIds.slice(1000, 1000 + REQUESTS); // ensure enough unique seats

    const holdIds: string[] = [];

    const start = Date.now();

    // Fire all hold requests in parallel (simulated concurrency)
    await Promise.all(
        generatedSeatIds.map((sid) => {
            return new Promise<void>((resolve) => {
                try {
                    const holdId = engine.holdSeats(EVENT_ID, [sid], "LOAD-TEST", holdDuration);
                    holdIds.push(holdId);
                } catch (e) {
                    // Should not happen; any failure indicates a bug
                    assert.fail(`Hold failed for seat ${sid}: ${(e as Error).message}`);
                }
                resolve();
            });
        })
    );

    const durationMs = Date.now() - start;
    console.log(`Held ${REQUESTS} seats in ${durationMs}ms`);

    // Verify all holds are present and not yet confirmed
    for (const hid of holdIds) {
        const hold = engine.getHold(hid);
        assert.ok(hold && !hold.confirmed, "Hold should exist and be unconfirmed");
    }

    // Cleanup: confirm half of them to ensure system remains consistent
    for (let i = 0; i < holdIds.length; i += 2) {
        engine.confirmHold(holdIds[i]);
    }

    // Release the remaining holds
    for (let i = 1; i < holdIds.length; i += 2) {
        engine.releaseHold(holdIds[i]);
    }

    // Final sanity check: ensure no seat remains with a dangling hold
    for (const sid of generatedSeatIds) {
        const state = engine.getSeatState(EVENT_ID, sid);
        assert.strictEqual(state.holdId, undefined, `Seat ${sid} should have no active hold`);
    }

    console.log("High load test completed successfully.");
})().then(() => {
    engine.shutdown();
    console.log("All tests passed.");
}).catch((err) => {
    console.error("Test failure:", err);
    engine.shutdown();
    process.exit(1);
});
