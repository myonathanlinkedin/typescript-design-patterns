import {
    Address,
    Hash,
    Transaction,
    Block,
    BlockHeader,
    State,
    Account,
} from "./types";

/**
 * Very lightweight deterministic hash function.
 * Not cryptographically secure – suitable for demo purposes only.
 */
function simpleHash(input: unknown): Hash {
    const str = typeof input === "string" ? input : JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    // Convert to unsigned hex string
    return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Compute transaction hash.
 */
export function computeTxHash(tx: Transaction): Hash {
    return simpleHash([tx.from, tx.to, tx.value, tx.nonce]);
}

/**
 * Compute Merkle root of a list of transactions using pairwise hashing.
 * For odd count, the last hash is duplicated.
 */
export function computeTxRoot(txs: readonly Transaction[]): Hash {
    if (txs.length === 0) {
        return simpleHash("empty");
    }
    let layer = txs.map(computeTxHash);
    while (layer.length > 1) {
        const next: Hash[] = [];
        for (let i = 0; i < layer.length; i += 2) {
            const left = layer[i];
            const right = i + 1 < layer.length ? layer[i + 1] : left;
            next.push(simpleHash(left + right));
        }
        layer = next;
    }
    return layer[0];
}

/**
 * Compute a deterministic state root by hashing sorted address entries.
 */
export function computeStateRoot(state: State): Hash {
    const entries = Object.entries(state)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([addr, acc]) => simpleHash([addr, acc.balance, acc.nonce]));
    if (entries.length === 0) {
        return simpleHash("empty_state");
    }
    // Reduce entries to a single hash
    let root = entries[0];
    for (let i = 1; i < entries.length; i++) {
        root = simpleHash(root + entries[i]);
    }
    return root;
}

/**
 * Apply a single transaction to the mutable state.
 * Throws on validation errors.
 */
export function applyTransaction(state: State, tx: Transaction): void {
    if (tx.value < 0) {
        throw new Error("Transaction value cannot be negative");
    }
    const sender = state[tx.from];
    const receiver = state[tx.to] ?? { balance: 0, nonce: 0 };

    if (!sender) {
        throw new Error(`Sender address ${tx.from} does not exist`);
    }
    if (sender.nonce !== tx.nonce) {
        throw new Error(
            `Invalid nonce for ${tx.from}: expected ${sender.nonce}, got ${tx.nonce}`
        );
    }
    if (sender.balance < tx.value) {
        throw new Error(
            `Insufficient balance for ${tx.from}: ${sender.balance} < ${tx.value}`
        );
    }

    // State transition
    sender.balance -= tx.value;
    sender.nonce += 1;
    receiver.balance += tx.value;

    // Persist receiver (even if new)
    state[tx.to] = receiver;
}

/**
 * Create a new block from a list of transactions.
 * The caller must ensure that the provided state reflects the post‑transaction state.
 */
export function createBlock(
    parentHash: Hash,
    state: State,
    transactions: readonly Transaction[],
    number: number,
    timestamp: number = Date.now()
): Block {
    const txRoot = computeTxRoot(transactions);
    const stateRoot = computeStateRoot(state);
    const header: BlockHeader = {
        parentHash,
        stateRoot,
        txRoot,
        number,
        timestamp,
    };
    return { header, transactions };
}

/**
 * Validate a block against its parent and a given pre‑state.
 * Returns the resulting state if validation succeeds.
 */
export function validateBlock(
    block: Block,
    parentBlock: Block | null,
    preState: State
): State {
    // Verify parent hash linkage
    const expectedParentHash = parentBlock ? computeBlockHash(parentBlock) : "genesis";
    if (block.header.parentHash !== expectedParentHash) {
        throw new Error("Parent hash mismatch");
    }

    // Verify transaction root
    const actualTxRoot = computeTxRoot(block.transactions);
    if (block.header.txRoot !== actualTxRoot) {
        throw new Error("Transaction root mismatch");
    }

    // Apply all transactions to a copy of the pre‑state
    const stateCopy: State = deepCopyState(preState);
    for (const tx of block.transactions) {
        applyTransaction(stateCopy, tx);
    }

    // Verify state root
    const actualStateRoot = computeStateRoot(stateCopy);
    if (block.header.stateRoot !== actualStateRoot) {
        throw new Error("State root mismatch");
    }

    return stateCopy;
}

/**
 * Compute block hash (header only) for linkage.
 */
export function computeBlockHash(block: Block): Hash {
    const { parentHash, stateRoot, txRoot, number, timestamp } = block.header;
    return simpleHash([parentHash, stateRoot, txRoot, number, timestamp]);
}

/**
 * Deep copy a State object (accounts are shallow-copied because they contain only primitives).
 */
function deepCopyState(state: State): State {
    const copy: State = {};
    for (const addr in state) {
        const acc = state[addr];
        copy[addr] = { balance: acc.balance, nonce: acc.nonce };
    }
    return copy;
}
