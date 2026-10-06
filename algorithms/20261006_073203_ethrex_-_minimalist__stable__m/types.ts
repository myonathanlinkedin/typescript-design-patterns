export type Address = string; // 0x-prefixed 40 hex chars
export type Hash = string;    // 0x-prefixed hex string

export interface Account {
    nonce: number;
    balance: bigint;
    code: Uint8Array;
    storage: Map<string, bigint>;
}

export interface Transaction {
    from: Address;
    to: Address;
    value: bigint;
    nonce: number;
    gasLimit: bigint;
    gasPrice: bigint;
    data: Uint8Array;
    signature: string;
}

export interface BlockHeader {
    parentHash: Hash;
    stateRoot: Hash;
    transactionsRoot: Hash;
    number: number;
    timestamp: number;
    miner: Address;
}

export interface Block {
    header: BlockHeader;
    transactions: Transaction[];
}
