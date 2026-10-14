import { compress, decompress } from "./core";

function assert(condition: boolean, message?: string): void {
  if (!condition) throw new Error(message ?? "Assertion failed");
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Unit Tests
function testEmpty(): void {
  const data = new Uint8Array([]);
  const comp = compress(data);
  const decomp = decompress(comp);
  assert(arraysEqual(data, decomp), "Empty array round‑trip failed");
}

function testLiteralOnly(): void {
  const data = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const comp = compress(data);
  const decomp = decompress(comp);
  assert(arraysEqual(data, decomp), "Literal only round‑trip failed");
  // Ensure compression does not increase size dramatically
  assert(comp.length <= data.length + 2, "Unexpected expansion");
}

function testRepetitive(): void {
  const data = new Uint8Array(200);
  data.fill(0xAA);
  const comp = compress(data);
  const decomp = decompress(comp);
  assert(arraysEqual(data, decomp), "Repetitive data round‑trip failed");
  // Expect strong compression
  assert(comp.length < data.length / 2, "Insufficient compression");
}

function testRandom(): void {
  const rng = (seed: number) => {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s & 0xff;
    };
  };
  const rand = rng(12345);
  const data = new Uint8Array(1024);
  for (let i = 0; i < data.length; i++) data[i] = rand();
  const comp = compress(data);
  const decomp = decompress(comp);
  assert(arraysEqual(data, decomp), "Random data round‑trip failed");
  // Random data may not compress much; ensure no overflow
  assert(comp.length <= data.length + 50, "Unexpected blow‑up");
}

function testEdgeOffsets(): void {
  // Construct data that forces offset = 255
  const prefix = new Uint8Array(255);
  prefix.fill(0x01);
  const suffix = new Uint8Array([0x01, 0x01, 0x01]); // repeats last three bytes
  const data = new Uint8Array([...prefix, ...suffix]);
  const comp = compress(data);
  const decomp = decompress(comp);
  assert(arraysEqual(data, decomp), "Edge offset round‑trip failed");
}

// Run all tests
function runTests(): void {
  testEmpty();
  testLiteralOnly();
  testRepetitive();
  testRandom();
  testEdgeOffsets();
  console.log("All tests passed.");
}

// Simple benchmark (optional, not part of verification)
function benchmark(): void {
  const size = 1 << 20; // 1 MiB
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) data[i] = i & 0xff;
  console.time("compress");
  const comp = compress(data);
  console.timeEnd("compress");
  console.time("decompress");
  const decomp = decompress(comp);
  console.timeEnd("decompress");
  assert(arraysEqual(data, decomp), "Benchmark round‑trip failed");
  console.log(`Original: ${size} B, Compressed: ${comp.length} B`);
}

// Entry point
runTests();
benchmark();
