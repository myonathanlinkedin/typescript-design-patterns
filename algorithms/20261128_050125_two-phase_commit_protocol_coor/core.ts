export enum MessageType {
    Prepare = "Prepare",
    VoteCommit = "VoteCommit",
    VoteAbort = "VoteAbort",
    Commit = "Commit",
    Abort = "Abort"
}

export interface Message {
    from: string;
    to: string;
    type: MessageType;
}

export enum ParticipantState {
    Init = "Init",
    Ready = "Ready",
    Committed = "Committed",
    Aborted = "Aborted"
}

export class Participant {
    readonly id: string;
    private state: ParticipantState = ParticipantState.Init;
    // Determines the vote this participant will cast when asked to prepare.
    private readonly willCommit: boolean;

    constructor(id: string, willCommit: boolean = true) {
        this.id = id;
        this.willCommit = willCommit;
    }

    /** Returns the current state – useful for tests. */
    getState(): ParticipantState {
        return this.state;
    }

    /** Process an incoming message and optionally produce a response. */
    receive(msg: Message): Message | null {
        if (msg.to !== this.id) {
            throw new Error(`Message addressed to ${msg.to} received by ${this.id}`);
        }

        switch (msg.type) {
            case MessageType.Prepare:
                return this.handlePrepare(msg);
            case MessageType.Commit:
                this.handleCommit(msg);
                return null;
            case MessageType.Abort:
                this.handleAbort(msg);
                return null;
            default:
                throw new Error(`Participant ${this.id} cannot handle message type ${msg.type}`);
        }
    }

    private handlePrepare(msg: Message): Message {
        if (this.state !== ParticipantState.Init) {
            throw new Error(`Participant ${this.id} received Prepare in invalid state ${this.state}`);
        }
        this.state = ParticipantState.Ready;
        const voteType = this.willCommit ? MessageType.VoteCommit : MessageType.VoteAbort;
        return { from: this.id, to: msg.from, type: voteType };
    }

    private handleCommit(msg: Message): void {
        if (this.state === ParticipantState.Committed) return; // idempotent
        if (this.state !== ParticipantState.Ready) {
            throw new Error(`Participant ${this.id} received Commit in invalid state ${this.state}`);
        }
        this.state = ParticipantState.Committed;
    }

    private handleAbort(msg: Message): void {
        if (this.state === ParticipantState.Aborted) return; // idempotent
        if (this.state !== ParticipantState.Ready && this.state !== ParticipantState.Init) {
            throw new Error(`Participant ${this.id} received Abort in invalid state ${this.state}`);
        }
        this.state = ParticipantState.Aborted;
    }
}

export enum CoordinatorState {
    Init = "Init",
    CollectingVotes = "CollectingVotes",
    Committed = "Committed",
    Aborted = "Aborted"
}

export class Coordinator {
    readonly id: string = "Coordinator";
    private readonly participants: Participant[];
    private state: CoordinatorState = CoordinatorState.Init;
    private readonly votes: Map<string, MessageType> = new Map();

    constructor(participants: Participant[]) {
        if (participants.length === 0) {
            throw new Error("Coordinator requires at least one participant");
        }
        this.participants = participants;
    }

    /** Returns the current state – useful for tests. */
    getState(): CoordinatorState {
        return this.state;
    }

    /** Initiates the two‑phase commit by sending Prepare to all participants. */
    startTransaction(): Message[] {
        if (this.state !== CoordinatorState.Init) {
            throw new Error(`Coordinator cannot start transaction in state ${this.state}`);
        }
        this.state = CoordinatorState.CollectingVotes;
        const msgs: Message[] = this.participants.map(p => ({
            from: this.id,
            to: p.id,
            type: MessageType.Prepare
        }));
        return msgs;
    }

    /** Process a vote (VoteCommit or VoteAbort) from a participant. */
    receive(msg: Message): Message[] {
        if (msg.to !== this.id) {
            throw new Error(`Coordinator received message not addressed to it: ${msg.to}`);
        }
        if (msg.type !== MessageType.VoteCommit && msg.type !== MessageType.VoteAbort) {
            throw new Error(`Coordinator cannot handle message type ${msg.type}`);
        }
        if (this.state !== CoordinatorState.CollectingVotes) {
            throw new Error(`Coordinator received vote in invalid state ${this.state}`);
        }
        if (this.votes.has(msg.from)) {
            // Duplicate vote – ignore as idempotent.
            return [];
        }
        this.votes.set(msg.from, msg.type);

        // If all votes received, decide outcome.
        if (this.votes.size === this.participants.length) {
            const anyAbort = Array.from(this.votes.values()).some(v => v === MessageType.VoteAbort);
            const finalType = anyAbort ? MessageType.Abort : MessageType.Commit;
            this.state = anyAbort ? CoordinatorState.Aborted : CoordinatorState.Committed;
            return this.participants.map(p => ({
                from: this.id,
                to: p.id,
                type: finalType
            }));
        }
        return [];
    }
}
