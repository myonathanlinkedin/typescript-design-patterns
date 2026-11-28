import { Participant, Coordinator, Message, MessageType } from "./core";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

/** Helper to deliver a batch of messages to participants and collect responses. */
function deliverToParticipants(messages: Message[], participants: Participant[]): Message[] {
    const responses: Message[] = [];
    for (const msg of messages) {
        const participant = participants.find(p => p.id === msg.to);
        if (!participant) {
            throw new Error(`No participant with id ${msg.to}`);
        }
        const resp = participant.receive(msg);
        if (resp) responses.push(resp);
    }
    return responses;
}

/** Helper to deliver coordinator messages to the coordinator. */
function deliverToCoordinator(messages: Message[], coordinator: Coordinator): void {
    for (const msg of messages) {
        const newMsgs = coordinator.receive(msg);
        // In this synchronous simulation, any further messages from coordinator are ignored here;
        // they will be processed by the test harness in the next step.
        if (newMsgs.length > 0) {
            // Should not happen in current flow.
            throw new Error("Unexpected extra messages from coordinator");
        }
    }
}

/* ---------- Unit Tests ---------- */

function testAllCommit(): void {
    const participants = [
        new Participant("P1"),
        new Participant("P2"),
        new Participant("P3")
    ];
    const coord = new Coordinator(participants);

    // Phase 1: Prepare
    const prepMsgs = coord.startTransaction();
    const votes = deliverToParticipants(prepMsgs, participants);
    // Phase 2: Coordinator processes votes
    const finalMsgs = votes.flatMap(v => {
        const msgs = coord.receive(v);
        return msgs;
    });
    // Deliver final decision
    deliverToParticipants(finalMsgs, participants);

    // Assertions
    assert(coord.getState() === "Committed", "Coordinator should be in Committed state");
    participants.forEach(p => {
        assert(p.getState() === "Committed", `Participant ${p.id} should be Committed`);
    });
}

function testAbortDueToOneAbort(): void {
    const participants = [
        new Participant("P1"),
        new Participant("P2", false), // will vote abort
        new Participant("P3")
    ];
    const coord = new Coordinator(participants);

    const prepMsgs = coord.startTransaction();
    const votes = deliverToParticipants(prepMsgs, participants);
    const finalMsgs = votes.flatMap(v => {
        const msgs = coord.receive(v);
        return msgs;
    });
    deliverToParticipants(finalMsgs, participants);

    assert(coord.getState() === "Aborted", "Coordinator should be Aborted");
    participants.forEach(p => {
        assert(p.getState() === "Aborted", `Participant ${p.id} should be Aborted`);
    });
}

function testInvalidTransition(): void {
    const participant = new Participant("P1");
    let errorCaught = false;
    try {
        // Directly send Commit without Prepare
        participant.receive({ from: "Coordinator", to: "P1", type: MessageType.Commit });
    } catch (e) {
        errorCaught = true;
    }
    assert(errorCaught, "Participant should reject Commit before Prepare");
}

function testIdempotentMessages(): void {
    const participants = [new Participant("P1")];
    const coord = new Coordinator(participants);

    const prep = coord.startTransaction();
    const votes = deliverToParticipants(prep, participants);
    const final = votes.flatMap(v => coord.receive(v));
    deliverToParticipants(final, participants);

    // Resend Commit (should be idempotent)
    const duplicateCommit: Message = { from: "Coordinator", to: "P1", type: MessageType.Commit };
    participants[0].receive(duplicateCommit);
    assert(participants[0].getState() === "Committed", "State should remain Committed after duplicate Commit");
}

/* ---------- Execute Tests ---------- */
function runAllTests(): void {
    const tests = [
        { name: "All participants commit", fn: testAllCommit },
        { name: "Abort due to one participant", fn: testAbortDueToOneAbort },
        { name: "Invalid transition handling", fn: testInvalidTransition },
        { name: "Idempotent message handling", fn: testIdempotentMessages }
    ];
    for (const t of tests) {
        try {
            t.fn();
            console.log(`✅ ${t.name}`);
        } catch (e) {
            console.error(`❌ ${t.name}: ${(e as Error).message}`);
        }
    }
}

runAllTests();
