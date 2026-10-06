import { Address, Hash, Account, Transaction, Block, BlockHeader } from "./types";

export class EthrexError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EthrexError";
    }
}

/**
 * Deterministic simple hash function for demonstration.
 * Not cryptographically secure.
 */
export function simpleHash(input: Uint8Array | string): Hash {
    const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
    let h = 0x811c9dc5;
    for (let i = 0; i < data.length; i++) {
        h = (h ^ data[i]) * 0x01000193;
        h >>>= 0;
    }
    // Produce 64‑bit hex string
    const hi = (h >>> 0).toString(16).padStart(8, "0");
    const lo = ((h * 0x100000000) >>> 0).toString(16).padStart(8, "0");
    return "0x" + hi + lo;
}

/**
 * Serialize an Account deterministically for hashing.
 */
function serializeAccount(acc: Account): string {
    const storageEntries = Array.from(acc.storage.entries())
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, v]) => `${k}:${v.toString()}`)
        .join("|");
    return `${acc.nonce}|${acc.balance.toString()}|${Array.from(acc.code).join(",")}|${storageEntries}`;
}

/**
 * Compute a Merkle‑like root of a list of hashes by pairwise hashing.
 * For an odd number of elements the last element is promoted.
 */
function merkleRoot(hashes: Hash[]): Hash {
    if (hashes.length === 0) {
        return simpleHash("");
    }
    let level = hashes.map(h => h);
    while (level.length > 1) {
        const next: Hash[] = [];
        for (let i = 0; i < level.length; i += 2) {
            if (i + 1 < level.length) {
                next.push(simpleHash(level[i] + level[i + 1]));
            } else {
                next.push(level[i]);
            }
        }
        level = next;
    }
    return level[0];
}

/**
 * Stub signature generation – deterministic and reversible for tests.
 */
function signTransaction(tx: Omit<Transaction, "signature">, privateKey: string): string {
    // In a real implementation this would be an ECDSA signature.
    // Here we simply embed the from address, nonce and a hash of the payload.
    const payload = `${tx.from}|${tx.to}|${tx.value.toString()}|${tx.nonce}|${tx.gasLimit.toString()}|${tx.gasPrice.toString()}`;
    const sigHash = simpleHash(payload + privateKey);
    return `sig-${tx.from}-${tx.nonce}-${sigHash}`;
}

/**
 * Stub verification – checks the signature format matches the transaction fields.
 */
function verifySignature(tx: Transaction): boolean {
    const parts = tx.signature.split("-");
    if (parts.length < 4) return false;
    const [, from, nonceStr] = parts;
    return from === tx.from && Number(nonceStr) === tx.nonce;
}

/**
 * Core engine handling state and block processing.
 */
export class EthrexEngine {
    private state: Map<Address, Account> = new Map();
    private latestBlockHash: Hash = simpleHash("genesis");
    private blockNumber: number = 0;

    /**
     * Retrieve an account, creating a default empty one if absent.
     */
    getAccount(address: Address): Account {
        let acc = this.state.get(address);
        if (!acc) {
            acc = {
                nonce: 0,
                balance: 0n,
                code: new Uint8Array(),
                storage: new Map()
            };
            this.state.set(address, acc);
        }
        return acc;
    }

    /**
     * Directly set an account – used for test harnesses.
     */
    setAccount(address: Address, account: Account): void {
        this.state.set(address, account);
    }

    /**
     * Compute the state root as a hash of all accounts sorted by address.
     */
    computeStateRoot(): Hash {
        const entries = Array.from(this.state.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([addr, acc]) => simpleHash(addr + serializeAccount(acc)));
        return merkleRoot(entries);
    }

    /**
     * Apply a single transaction to the current state.
     * Throws EthrexError on validation failure.
     */
    applyTransaction(tx: Transaction): void {
        if (!verifySignature(tx)) {
            throw new EthrexError("Invalid signature");
        }

        const sender = this.getAccount(tx.from);
        const receiver = this.getAccount(tx.to);

        if (sender.nonce !== tx.nonce) {
            throw new EthrexError(`Invalid nonce: expected ${sender.nonce}, got ${tx.nonce}`);
        }

        const totalCost = tx.value + tx.gasLimit * tx.gasPrice;
        if (sender.balance < totalCost) {
            throw new EthrexError("Insufficient balance for value + gas");
        }

        // Deduct total cost from sender
        sender.balance -= totalCost;
        sender.nonce += 1;

        // Transfer value (gas is considered burned)
        receiver.balance += tx.value;
    }

    /**
     * Compute the root hash of a transaction list.
     */
    computeTransactionsRoot(txs: Transaction[]): Hash {
        const txHashes = txs.map(tx => simpleHash(JSON.stringify(tx)));
        return merkleRoot(txHashes);
    }

    /**
     * Process a block: validate header, apply all transactions atomically,
     * and update the canonical chain tip.
     */
    processBlock(block: Block): void {
        // Header sanity checks
        if (block.header.parentHash !== this.latestBlockHash) {
            throw new EthrexError("Parent hash mismatch");
        }
        if (block.header.number !== this.blockNumber + 1) {
            throw new EthrexError("Incorrect block number");
        }

        // Verify transactions root
        const computedTxRoot = this.computeTransactionsRoot(block.transactions);
        if (computedTxRoot !== block.header.transactionsRoot) {
            throw new EthrexError("Transactions root mismatch");
        }

        // Apply transactions sequentially
        for (const tx of block.transactions) {
            this.applyTransaction(tx);
        }

        // Compute new state root and verify header
        const newStateRoot = this.computeStateRoot();
        if (newStateRoot !== block.header.stateRoot) {
            throw new EthrexError("State root mismatch after processing");
        }

        // Update chain tip
        this.latestBlockHash = simpleHash(JSON.stringify(block.header));
        this.blockNumber = block.header.number;
    }

    /**
     * Helper to construct a signed transaction.
     */
    createSignedTransaction(
        from: Address,
        to: Address,
        value: bigint,
        nonce: number,
        gasLimit: bigint,
        gasPrice: bigint,
        data: Uint8Array,
        privateKey: string
    ): Transaction {
        const unsigned: Omit<Transaction, "signature"> = {
            from,
            to,
            value,
            nonce,
            gasLimit,
            gasPrice,
            data
        };
        const signature = signTransaction(unsigned, privateKey);
        return { ...unsigned, signature };
    }

    /**
     * Helper to construct a block header given the current state.
     */
    createBlockHeader(
        parentHash: Hash,
        transactionsRoot: Hash,
        miner: Address,
        timestamp: number = Date.now()
    ): BlockHeader {
        const stateRoot = this.computeStateRoot();
        return {
            parentHash,
            stateRoot,
            transactionsRoot,
            number: this.blockNumber + 1,
            timestamp,
            miner
        };
    }
}
