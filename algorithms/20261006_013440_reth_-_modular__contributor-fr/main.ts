import {
    Address,
    Account,
    State,
    Transaction,
    Block,
    fnv1a,
    createBlock,
    applyBlock,
    computeMerkleRoot,
} from './core';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// ---------- Unit Tests ----------
function runTests(): void {
    // Initialize state with two accounts.
    const state: State = new Map<Address, Account>([
        ['0xAlice', { balance: 1000, nonce: 0 }],
        ['0xBob', { balance: 500, nonce: 0 }],
    ]);

    // Create a simple transaction.
    const tx1: Transaction = {
        from: '0xAlice',
        to: '0xBob',
        value: 200,
        nonce: 0,
    };

    // Apply transaction directly.
    applyBlock(
        createBlock(1, '0x0', [tx1]),
        state
    );

    // Verify balances and nonces.
    const alice = state.get('0xAlice')!;
    const bob = state.get('0xBob')!;
    assert(alice.balance === 800, 'Alice balance after tx1');
    assert(alice.nonce === 1, 'Alice nonce after tx1');
    assert(bob.balance === 700, 'Bob balance after tx1');

    // Create multiple transactions.
    const txs: Transaction[] = [
        { from: '0xBob', to: '0xCharlie', value: 300, nonce: 0 },
        { from: '0xAlice', to: '0xDave', value: 150, nonce: 1 },
    ];

    // Extend state with new accounts.
    state.set('0xCharlie', { balance: 0, nonce: 0 });
    state.set('0xDave', { balance: 0, nonce: 0 });

    const block = createBlock(2, state.get('0xAlice')!.nonce.toString(), txs);
    applyBlock(block, state);

    const charlie = state.get('0xCharlie')!;
    const dave = state.get('0xDave')!;
    const bobAfter = state.get('0xBob')!;

    assert(bobAfter.balance === 400, 'Bob balance after second block');
    assert(bobAfter.nonce === 1, 'Bob nonce after second block');
    assert(charlie.balance === 300, 'Charlie balance after second block');
    assert(dave.balance === 150, 'Dave balance after second block');

    // Merkle root sanity check.
    const manualRoot = computeMerkleRoot(txs);
    assert(manualRoot === block.merkleRoot, 'Merkle root matches');

    console.log('All unit tests passed.');
}

// ---------- Benchmark ----------
function runBenchmark(): void {
    const txCount = 10000;
    const state: State = new Map<Address, Account>();
    const sender: Address = '0xSender';
    state.set(sender, { balance: txCount * 10, nonce: 0 });

    const txs: Transaction[] = [];
    for (let i = 0; i < txCount; i++) {
        const to = `0xRecipient${i}`;
        txs.push({
            from: sender,
            to,
            value: 1,
            nonce: i,
        });
        state.set(to, { balance: 0, nonce: 0 });
    }

    const start = Date.now();
    const block = createBlock(1, '0x0', txs);
    applyBlock(block, state);
    const duration = Date.now() - start;

    const senderFinal = state.get(sender)!;
    assert(senderFinal.balance === 0, 'Sender balance after benchmark');
    assert(senderFinal.nonce === txCount, 'Sender nonce after benchmark');

    console.log(`Benchmark: processed ${txCount} txs in ${duration} ms`);
}

// ---------- Entry Point ----------
function main(): void {
    try {
        runTests();
        runBenchmark();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
