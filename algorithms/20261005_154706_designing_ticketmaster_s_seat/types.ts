export interface Seat {
    seatId: string;
    // The holdId currently occupying the seat, undefined if free
    holdId?: string;
    // The ticketId if the seat is sold, undefined otherwise
    ticketId?: string;
}

export interface Hold {
    holdId: string;
    eventId: string;
    seatIds: string[];
    customerId: string;
    expiresAt: number; // epoch ms
    confirmed: boolean;
}

export interface Ticket {
    ticketId: string;
    eventId: string;
    seatId: string;
    customerId: string;
    issuedAt: number; // epoch ms
}

export interface Event {
    eventId: string;
    // Map seatId -> Seat
    seats: Map<string, Seat>;
}
