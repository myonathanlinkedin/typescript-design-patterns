import {
    Address,
    Transaction,
    State,
    Block,
} from "./types";
import {
    computeTxHash,
    computeTxRoot,
    computeStateRoot,
    applyTransaction,
    createBlock,
    validateBlock,
    computeBlockHash,
} from "./engine";

function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

// Demo driver
function runDemo(): void {
    // Genesis state
    const genesisState: State = {
        "0xAlice": { balance: 1_000, nonce: 0 },
        "0xBob": { balance: 500, nonce: 0 },
    };
    const genesisHash = "genesis";

    // Valid transaction: Alice sends 200 to Bob
    const tx1: Transaction = {
        from: "0xAlice",
        to: "0xBob",
        value: 200,
        nonce: 0,
    };
    // Invalid transaction: Bob tries to send more than his balance
    const txInvalid: Transaction = {
        from: "0xBob",
        to: "0xAlice",
        value: 1_000,
        nonce: 0,
    };
    // Duplicate nonce transaction (should fail)
    const txDuplicateNonce: Transaction = {
        from: "0xAlice",
        to: "0xBob",
        value: 50,
        nonce: 0, // same as tx1
    };

    // Apply tx1 to a copy of genesis state
    const stateAfterTx1 = JSON.parse(JSON.stringify(genesisState)) as State;
    applyTransaction(stateAfterTx1, tx1);

    // Build block containing only tx1
    const block1 = createBlock(genesisHash, stateAfterTx1, [tx1], 1);
    const block1Hash = computeBlockHash(block1);

    // Validate block1 against genesis
    const stateAfterBlock1 = validateBlock(block1, null, genesisState);
    assert(stateAfterBlock1["0xAlice"].balance === 800, "Alice balance after block1");
    assert(stateAfterBlock1["0xBob"].balance === 700, "Bob balance after block1");
    assert(stateAfterBlock1["0xAlice"].nonce === 1, "Alice nonce after block1");

    // Edge case tests
    // 1. Insufficient funds
    try {
        const badState = JSON.parse(JSON.stringify(stateAfterBlock1)) as State;
        applyTransaction(badState, txInvalid);
        assert(false, "Expected insufficient funds error");
    } catch (e) {
        assert((e as Error).message.includes("Insufficient balance"), "Caught insufficient balance");
    }

    // 2. Duplicate nonce
    try {
        const badState = JSON.parse(JSON.stringify(stateAfterBlock1)) as State;
        applyTransaction(badState, txDuplicateNonce);
        assert(false, "Expected duplicate nonce error");
    } catch (e) {
        assert((e as Error).message.includes("Invalid nonce"), "Caught invalid nonce");
    }

    // 3. Block with wrong txRoot
    try {
        const tamperedBlock: Block = {
            ...block1,
            header: { ...block1.header, txRoot: "tampered" },
        };
        validateBlock(tamperedBlock, null, genesisState);
        assert(false, "Expected txRoot mismatch error");
    } catch (e) {
        assert((e as Error).message.includes("Transaction root mismatch"), "Caught txRoot mismatch");
    }

    // 4. Block with wrong parent hash
    try {
        const anotherBlock = createBlock("wrongParentHash", stateAfterBlock1, [], 2);
        validateBlock(anotherBlock, block1, stateAfterBlock1);
        assert(false, "Expected parent hash mismatch error");
    } catch (e) {
        assert((e as Error).message.includes("Parent hash mismatch"), "Caught parent hash mismatch");
    }

    console.log("All assertions passed. Demo completed successfully.");
}

// Execute demo
runDemo();
