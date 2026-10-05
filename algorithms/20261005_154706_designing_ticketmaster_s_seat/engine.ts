import { Seat, Hold, Ticket, Event } from "./types";

export class SeatHoldEngine {
    // All events indexed by eventId
    private events: Map<string, Event> = new Map();

    // Holds indexed by holdId
    private holds: Map<string, Hold> = new Map();

    // Tickets indexed by ticketId
    private tickets: Map<string, Ticket> = new Map();

    // Simple monotonic counters for IDs
    private holdCounter: number = 0;
    private ticketCounter: number = 0;

    // Cleanup interval (ms)
    private cleanupIntervalMs: number = 5_000;
    private cleanupTimer: NodeJS.Timeout;

    constructor() {
        // Periodic cleanup of expired holds
        this.cleanupTimer = setInterval(() => this.cleanupExpiredHolds(), this.cleanupIntervalMs);
    }

    // Graceful shutdown
    public shutdown(): void {
        clearInterval(this.cleanupTimer);
    }

    // Create a new event with a given set of seat IDs
    public createEvent(eventId: string, seatIds: string[]): void {
        if (this.events.has(eventId)) {
            throw new Error(`Event ${eventId} already exists`);
        }
        const seatMap = new Map<string, Seat>();
        for (const seatId of seatIds) {
            seatMap.set(seatId, { seatId });
        }
        this.events.set(eventId, { eventId, seats: seatMap });
    }

    // Attempt to hold a set of seats for a customer
    public holdSeats(
        eventId: string,
        seatIds: string[],
        customerId: string,
        holdDurationMs: number
    ): string {
        const event = this.events.get(eventId);
        if (!event) {
            throw new Error(`Event ${eventId} not found`);
        }

        // Optimistic check: ensure all requested seats are free
        for (const seatId of seatIds) {
            const seat = event.seats.get(seatId);
            if (!seat) {
                throw new Error(`Seat ${seatId} does not exist in event ${eventId}`);
            }
            if (seat.holdId !== undefined || seat.ticketId !== undefined) {
                throw new Error(`Seat ${seatId} is already held or sold`);
            }
        }

        // All seats are free; allocate a hold atomically
        const holdId = `H-${++this.holdCounter}`;
        const expiresAt = Date.now() + holdDurationMs;
        const hold: Hold = {
            holdId,
            eventId,
            seatIds: [...seatIds],
            customerId,
            expiresAt,
            confirmed: false,
        };
        this.holds.set(holdId, hold);

        // Mark seats with the holdId
        for (const seatId of seatIds) {
            const seat = event.seats.get(seatId)!;
            seat.holdId = holdId;
        }

        return holdId;
    }

    // Confirm a hold, converting it into tickets
    public confirmHold(holdId: string): string[] {
        const hold = this.holds.get(holdId);
        if (!hold) {
            throw new Error(`Hold ${holdId} not found`);
        }
        if (hold.confirmed) {
            throw new Error(`Hold ${holdId} already confirmed`);
        }
        if (Date.now() > hold.expiresAt) {
            this.releaseHoldInternal(hold);
            throw new Error(`Hold ${holdId} has expired`);
        }

        const event = this.events.get(hold.eventId)!;
        const ticketIds: string[] = [];

        for (const seatId of hold.seatIds) {
            const seat = event.seats.get(seatId)!;
            // Double-check seat is still held by this hold
            if (seat.holdId !== holdId) {
                throw new Error(`Seat ${seatId} is no longer held by ${holdId}`);
            }
            const ticketId = `T-${++this.ticketCounter}`;
            const ticket: Ticket = {
                ticketId,
                eventId: hold.eventId,
                seatId,
                customerId: hold.customerId,
                issuedAt: Date.now(),
            };
            this.tickets.set(ticketId, ticket);
            seat.ticketId = ticketId;
            seat.holdId = undefined;
            ticketIds.push(ticketId);
        }

        hold.confirmed = true;
        // Hold remains in map for audit but cannot be reused
        return ticketIds;
    }

    // Release a hold without confirming (e.g., client cancellation)
    public releaseHold(holdId: string): void {
        const hold = this.holds.get(holdId);
        if (!hold) {
            throw new Error(`Hold ${holdId} not found`);
        }
        if (hold.confirmed) {
            throw new Error(`Hold ${holdId} already confirmed and cannot be released`);
        }
        this.releaseHoldInternal(hold);
    }

    // Internal release logic used by both explicit release and expiration cleanup
    private releaseHoldInternal(hold: Hold): void {
        const event = this.events.get(hold.eventId);
        if (!event) {
            // Event might have been removed; just delete hold
            this.holds.delete(hold.holdId);
            return;
        }
        for (const seatId of hold.seatIds) {
            const seat = event.seats.get(seatId);
            if (seat && seat.holdId === hold.holdId) {
                seat.holdId = undefined;
            }
        }
        this.holds.delete(hold.holdId);
    }

    // Periodic cleanup of expired holds
    private cleanupExpiredHolds(): void {
        const now = Date.now();
        for (const hold of Array.from(this.holds.values())) {
            if (!hold.confirmed && hold.expiresAt <= now) {
                this.releaseHoldInternal(hold);
            }
        }
    }

    // Diagnostic helpers for testing
    public getSeatState(eventId: string, seatId: string): { holdId?: string; ticketId?: string } {
        const event = this.events.get(eventId);
        if (!event) {
            throw new Error(`Event ${eventId} not found`);
        }
        const seat = event.seats.get(seatId);
        if (!seat) {
            throw new Error(`Seat ${seatId} not found`);
        }
        return { holdId: seat.holdId, ticketId: seat.ticketId };
    }

    public getHold(holdId: string): Hold | undefined {
        return this.holds.get(holdId);
    }

    public getTicket(ticketId: string): Ticket | undefined {
        return this.tickets.get(ticketId);
    }
}
