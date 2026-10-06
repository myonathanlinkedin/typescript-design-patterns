export type Address = string;

export interface Account {
    balance: number;
    nonce: number;
}

export type State = Map<Address, Account>;

export interface Transaction {
    from: Address;
    to: Address;
    value: number;
    nonce: number;
}

export interface Block {
    index: number;
    previousHash: string;
    timestamp: number;
    transactions: Transaction[];
    merkleRoot: string;
    hash: string;
}

/**
 * Simple 32‑bit FNV‑1a hash returning an 8‑character hex string.
 */
export function fnv1a(input: string): string {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    // Convert to unsigned and pad.
    return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Deterministic object hash based on JSON representation.
 */
export function objectHash(obj: unknown): string {
    return fnv1a(JSON.stringify(obj));
}

/**
 * Compute Merkle root of a transaction list using pairwise hashing.
 */
export function computeMerkleRoot(txs: Transaction[]): string {
    if (txs.length === 0) return '';
    let layer = txs.map(t => objectHash(t));
    while (layer.length > 1) {
        const next: string[] = [];
        for (let i = 0; i < layer.length; i += 2) {
            const left = layer[i];
            const right = layer[i + 1] ?? left;
            next.push(fnv1a(left + right));
        }
        layer = next;
    }
    return layer[0];
}

/**
 * Create a new block from given transactions and previous hash.
 */
export function createBlock(
    index: number,
    previousHash: string,
    txs: Transaction[],
    timestamp = Date.now()
): Block {
    const merkleRoot = computeMerkleRoot(txs);
    const header = JSON.stringify({ index, previousHash, timestamp, merkleRoot });
    const hash = fnv1a(header);
    return { index, previousHash, timestamp, transactions: txs, merkleRoot, hash };
}

/**
 * Apply a single transaction to the state, performing basic validation.
 */
export function applyTransaction(tx: Transaction, state: State): void {
    const sender = state.get(tx.from);
    if (!sender) throw new Error('Sender does not exist');
    if (sender.nonce !== tx.nonce) throw new Error('Invalid nonce');
    if (sender.balance < tx.value) throw new Error('Insufficient balance');

    const receiver = state.get(tx.to);
    sender.balance -= tx.value;
    sender.nonce += 1;

    if (receiver) {
        receiver.balance += tx.value;
    } else {
        state.set(tx.to, { balance: tx.value, nonce: 0 });
    }
}

/**
 * Apply a block to the state after verifying its Merkle root.
 */
export function applyBlock(block: Block, state: State): void {
    const expectedRoot = computeMerkleRoot(block.transactions);
    if (expectedRoot !== block.merkleRoot) throw new Error('Invalid Merkle root');
    for (const tx of block.transactions) {
        applyTransaction(tx, state);
    }
}
