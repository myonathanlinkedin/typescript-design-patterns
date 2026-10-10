export interface Player {
    readonly name: string;
    readonly skill: number; // non‑negative integer
}

export type Team = ReadonlyArray<Player>;

export interface PartitionResult {
    readonly teamA: Team;
    readonly teamB: Team;
    readonly skillDifference: number;
}
