export function sequentialPrefixSum(arr: number[]): number[] {
    const result: number[] = new Array(arr.length);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
        result[i] = sum;
    }
    return result;
}

export function sum(arr: number[]): number {
    let total = 0;
    for (const v of arr) total += v;
    return total;
}

export async function parallelPrefixSum(arr: number[], workers: number): Promise<number[]> {
    if (workers <= 1 || arr.length <= 1) {
        return sequentialPrefixSum(arr);
    }
    const chunkSize = Math.ceil(arr.length / workers);
    const chunks: number[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    const partialSums = await Promise.all(chunks.map(sequentialPrefixSum));
    const offsets: number[] = [];
    let offset = 0;
    for (const chunk of partialSums) {
        offsets.push(offset);
        offset += sum(chunk);
    }
    const result: number[] = [];
    for (let i = 0; i < partialSums.length; i++) {
        const chunk = partialSums[i];
        const off = offsets[i];
        for (let j = 0; j < chunk.length; j++) {
            result.push(chunk[j] + off);
        }
    }
    return result;
}

export class Timer {
    private startTime: number = 0;
    private endTime: number = 0;
    start() { this.startTime = performance.now(); }
    stop() { this.endTime = performance.now(); }
    elapsed(): number { return this.endTime - this.startTime; }
}
