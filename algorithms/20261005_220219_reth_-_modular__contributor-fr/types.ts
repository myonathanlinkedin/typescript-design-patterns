export type Address = string;
export type Hash = string;

export interface Transaction {
    readonly from: Address;
    readonly to: Address;
    readonly value: number; // wei-like integer
    readonly nonce: number;
}

export interface BlockHeader {
    readonly parentHash: Hash;
    readonly stateRoot: Hash;
    readonly txRoot: Hash;
    readonly number: number;
    readonly timestamp: number;
}

export interface Block {
    readonly header: BlockHeader;
    readonly transactions: readonly Transaction[];
}

export interface Account {
    balance: number;
    nonce: number;
}

export interface State {
    readonly [address: string]: Account;
}
