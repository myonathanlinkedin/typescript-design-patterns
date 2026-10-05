export type DataChunk = {
    id: string;
    size: number;
    payload: any;
};

export interface Facility {
    readonly id: string;
    readonly capacity: number;
    used: number;
    fetchData(chunkId: string): Promise<DataChunk | null>;
    hasChunk(chunkId: string): boolean;
    storeChunk(chunk: DataChunk): void;
}

export class SimpleFacility implements Facility {
    readonly id: string;
    readonly capacity: number;
    used: number = 0;
    private storage: Map<string, DataChunk> = new Map();

    constructor(id: string, capacity: number) {
        this.id = id;
        this.capacity = capacity;
    }

    async fetchData(chunkId: string): Promise<DataChunk | null> {
        // Simulate I/O latency
        await new Promise(res => setTimeout(res, Math.random() * 10));
        return this.storage.get(chunkId) ?? null;
    }

    hasChunk(chunkId: string): boolean {
        return this.storage.has(chunkId);
    }

    storeChunk(chunk: DataChunk): void {
        if (this.used + chunk.size > this.capacity) {
            throw new Error(`Facility ${this.id} out of capacity`);
        }
        this.storage.set(chunk.id, chunk);
        this.used += chunk.size;
    }
}

export interface DataLease {
    readonly leaseId: string;
    readonly facilityId: string;
    readonly chunkIds: string[];
    readonly expiresAt: number;
}

export class LeaseManager {
    private leases: Map<string, DataLease> = new Map();

    requestLease(facility: Facility, chunkIds: string[], ttlMs: number): DataLease {
        const leaseId = `lease-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const expiresAt = Date.now() + ttlMs;
        const lease: DataLease = { leaseId, facilityId: facility.id, chunkIds, expiresAt };
        this.leases.set(leaseId, lease);
        return lease;
    }

    releaseLease(leaseId: string): void {
        this.leases.delete(leaseId);
    }

    getActiveLeases(): DataLease[] {
        const now = Date.now();
        return Array.from(this.leases.values()).filter(l => l.expiresAt > now);
    }

    purgeExpired(): void {
        const now = Date.now();
        for (const [id, lease] of this.leases) {
            if (lease.expiresAt <= now) this.leases.delete(id);
        }
    }
}

export interface Aggregator {
    aggregate(chunkIds: string[]): Promise<DataChunk[]>;
    addFacility(facility: Facility): void;
    removeFacility(facilityId: string): void;
    listFacilities(): string[];
}

export class ElasticAggregator implements Aggregator {
    private facilities: Map<string, Facility> = new Map();
    private leaseMgr: LeaseManager = new LeaseManager();
    private leaseTTL: number = 5_000; // 5 seconds default

    constructor(initialFacilities: Facility[] = []) {
        for (const f of initialFacilities) this.facilities.set(f.id, f);
    }

    addFacility(facility: Facility): void {
        this.facilities.set(facility.id, facility);
    }

    removeFacility(facilityId: string): void {
        this.facilities.delete(facilityId);
    }

    listFacilities(): string[] {
        return Array.from(this.facilities.keys());
    }

    private async fetchFromFacility(facility: Facility, chunkIds: string[]): Promise<DataChunk[]> {
        const lease = this.leaseMgr.requestLease(facility, chunkIds, this.leaseTTL);
        const results: DataChunk[] = [];
        for (const id of lease.chunkIds) {
            const chunk = await facility.fetchData(id);
            if (chunk) results.push(chunk);
        }
        this.leaseMgr.releaseLease(lease.leaseId);
        return results;
    }

    async aggregate(chunkIds: string[]): Promise<DataChunk[]> {
        // Simple round-robin assignment of chunks to facilities respecting capacity
        const facilityArray = Array.from(this.facilities.values());
        if (facilityArray.length === 0) throw new Error('No facilities available');

        const assignments: Map<string, string[]> = new Map(); // facilityId -> chunkIds
        let idx = 0;
        for (const cid of chunkIds) {
            const fac = facilityArray[idx % facilityArray.length];
            if (!assignments.has(fac.id)) assignments.set(fac.id, []);
            assignments.get(fac.id)!.push(cid);
            idx++;
        }

        const fetchPromises: Promise<DataChunk[]>[] = [];
        for (const [fid, cids] of assignments) {
            const fac = this.facilities.get(fid)!;
            fetchPromises.push(this.fetchFromFacility(fac, cids));
        }

        const fetched = await Promise.all(fetchPromises);
        // Flatten
        return fetched.flat();
    }
}
