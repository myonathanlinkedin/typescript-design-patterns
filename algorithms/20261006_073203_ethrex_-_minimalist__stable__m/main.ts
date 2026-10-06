import { Address, Account, Transaction, Block } from "./types";
import { EthrexEngine, EthrexError, simpleHash } from "./engine";

// Utility to create a deterministic address from a string (for tests)
function makeAddress(name: string): Address {
    const hash = simpleHash(name);
    // Ensure 40 hex chars after 0x
    return "0x" + hash.slice(2, 42);
}

// Initialize engine
const engine = new EthrexEngine();

// Create two test accounts with initial balances
const alice: Address = makeAddress("alice");
const bob: Address = makeAddress("bob");
const miner: Address = makeAddress("miner");

engine.setAccount(alice, {
    nonce: 0,
    balance: 1_000_000n,
    code: new Uint8Array(),
    storage: new Map()
});

engine.setAccount(bob, {
    nonce: 0,
    balance: 0n,
    code: new Uint8Array(),
    storage: new Map()
});

engine.setAccount(miner, {
    nonce: 0,
    balance: 0n,
    code: new Uint8Array(),
    storage: new Map()
});

// Private keys are just deterministic strings for the stub signer
const aliceKey = "alice-secret";
const minerKey = "miner-secret";

// Build a transaction: Alice sends 100_000 wei to Bob
const tx1: Transaction = engine.createSignedTransaction(
    alice,
    bob,
    100_000n,
    0,                     // nonce matches Alice's current nonce
    21_000n,               // gas limit
    1n,                    // gas price
    new Uint8Array(),     // empty data
    aliceKey
);

// Build block containing the transaction
const txRoot = engine.computeTransactionsRoot([tx1]);
const blockHeader = engine.createBlockHeader(
    // parent hash is genesis for first block
    simpleHash("genesis"),
    txRoot,
    miner
);
const block: Block = {
    header: blockHeader,
    transactions: [tx1]
};

// Process the block
try {
    engine.processBlock(block);
    console.log("Block processed successfully.");
} catch (e) {
    console.error("Block processing failed:", e);
}

// Assertions
const aliceAfter = engine.getAccount(alice);
const bobAfter = engine.getAccount(bob);
const minerAfter = engine.getAccount(miner);

// Alice balance should be reduced by value + gas (100_000 + 21_000*1)
const expectedAliceBalance = 1_000_000n - 100_000n - 21_000n;
console.assert(aliceAfter.balance === expectedAliceBalance, "Alice balance incorrect");

// Bob should receive the value
console.assert(bobAfter.balance === 100_000n, "Bob balance incorrect");

// Alice nonce should have incremented
console.assert(aliceAfter.nonce === 1, "Alice nonce incorrect");

// Miner does not receive fees in this minimalist model (fees are burned)
console.assert(minerAfter.balance === 0n, "Miner balance should be zero");

// Edge‑case: insufficient balance
const txBad: Transaction = engine.createSignedTransaction(
    alice,
    bob,
    900_000n, // exceeds remaining balance
    1,        // next nonce
    21_000n,
    1n,
    new Uint8Array(),
    aliceKey
);
const badBlockHeader = engine.createBlockHeader(
    engine.processBlock ? simpleHash(JSON.stringify(block.header)) : simpleHash("genesis"),
    engine.computeTransactionsRoot([txBad]),
    miner
);
const badBlock: Block = {
    header: badBlockHeader,
    transactions: [txBad]
};

let caught = false;
try {
    engine.processBlock(badBlock);
} catch (e) {
    if (e instanceof EthrexError) {
        caught = true;
        console.log("Correctly caught error for insufficient balance:", e.message);
    }
}
console.assert(caught, "Expected error for insufficient balance was not thrown");

// Edge‑case: wrong nonce
const txWrongNonce: Transaction = engine.createSignedTransaction(
    alice,
    bob,
    10_000n,
    5, // incorrect nonce
    21_000n,
    1n,
    new Uint8Array(),
    aliceKey
);
const wrongNonceHeader = engine.createBlockHeader(
    engine.processBlock ? simpleHash(JSON.stringify(badBlock.header)) : simpleHash("genesis"),
    engine.computeTransactionsRoot([txWrongNonce]),
    miner
);
const wrongNonceBlock: Block = {
    header: wrongNonceHeader,
    transactions: [txWrongNonce]
};

caught = false;
try {
    engine.processBlock(wrongNonceBlock);
} catch (e) {
    if (e instanceof EthrexError) {
        caught = true;
        console.log("Correctly caught error for wrong nonce:", e.message);
    }
}
console.assert(caught, "Expected error for wrong nonce was not thrown");

// Demo: print final state root
console.log("Final state root:", engine.computeStateRoot());
