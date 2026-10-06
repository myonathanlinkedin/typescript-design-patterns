export class RingBuffer<T> {
    private buffer: Array<T | undefined>;
    private capacity: number;
    private head: number = 0;
    private tail: number = 0;
    private size: number = 0;

    constructor(capacity: number) {
        if (capacity <= 0) {
            throw new Error('Capacity must be greater than 0');
        }
        this.capacity = capacity;
        this.buffer = new Array<T | undefined>(capacity);
    }

    push(item: T): void {
        this.buffer[this.tail] = item;
        this.tail = (this.tail + 1) % this.capacity;
        if (this.size < this.capacity) {
            this.size++;
        } else {
            this.head = (this.head + 1) % this.capacity;
        }
    }

    get(index: number): T | undefined {
        if (index < 0 || index >= this.size) {
            return undefined;
        }
        const realIndex = (this.head + index) % this.capacity;
        return this.buffer[realIndex];
    }

    toArray(): T[] {
        const result: T[] = [];
        for (let i = 0; i < this.size; i++) {
            const val = this.get(i);
            if (val !== undefined) {
                result.push(val);
            }
        }
        return result;
    }

    getSize(): number {
        return this.size;
    }

    isFull(): boolean {
        return this.size === this.capacity;
    }
}

function computePercentile(data: number[], percentile: number): number {
    if (data.length === 0) {
        return NaN;
    }
    const sorted = [...data].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export interface Stats {
    avg: number;
    median: number;
    p95: number;
    p99: number;
}

export class PerformanceMetrics {
    private latencyBuffer: RingBuffer<number>;
    private bandwidthBuffer: RingBuffer<number>;

    constructor(latencyCapacity: number = 1000, bandwidthCapacity: number = 1000) {
        this.latencyBuffer = new RingBuffer<number>(latencyCapacity);
        this.bandwidthBuffer = new RingBuffer<number>(bandwidthCapacity);
    }

    recordLatency(ms: number): void {
        if (ms < 0) {
            throw new Error('Latency cannot be negative');
        }
        this.latencyBuffer.push(ms);
    }

    recordBandwidth(bytesPerSec: number): void {
        if (bytesPerSec < 0) {
            throw new Error('Bandwidth cannot be negative');
        }
        this.bandwidthBuffer.push(bytesPerSec);
    }

    getLatencyStats(): Stats {
        const data = this.latencyBuffer.toArray();
        return this.calculateStats(data);
    }

    getBandwidthStats(): Stats {
        const data = this.bandwidthBuffer.toArray();
        return this.calculateStats(data);
    }

    private calculateStats(data: number[]): Stats {
        const n = data.length;
        if (n === 0) {
            return { avg: NaN, median: NaN, p95: NaN, p99: NaN };
        }
        const sum = data.reduce((a, b) => a + b, 0);
        const avg = sum / n;
        const median = computePercentile(data, 50);
        const p95 = computePercentile(data, 95);
        const p99 = computePercentile(data, 99);
        return { avg, median, p95, p99 };
    }

    getReport(): string {
        const latency = this.getLatencyStats();
        const bandwidth = this.getBandwidthStats();
        return `
Performance Report:
-------------------
Latency (ms):
  Avg: ${latency.avg.toFixed(2)}
  Median: ${latency.median.toFixed(2)}
  95th Percentile: ${latency.p95.toFixed(2)}
  99th Percentile: ${latency.p99.toFixed(2)}

Bandwidth (bytes/s):
  Avg: ${bandwidth.avg.toFixed(2)}
  Median: ${bandwidth.median.toFixed(2)}
  95th Percentile: ${bandwidth.p95.toFixed(2)}
  99th Percentile: ${bandwidth.p99.toFixed(2)}
`.trim();
    }
}
