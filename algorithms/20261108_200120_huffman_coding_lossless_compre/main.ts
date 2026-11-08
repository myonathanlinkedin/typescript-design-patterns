import {
    compress,
    decompress,
    buildFrequencyMap,
    generateCodes,
} from "./engine";

/* Simple assertion helper */
function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/* ---------- Unit Tests ---------- */

// Test 1: Empty string
{
    const input = "";
    const { encoded, tree } = compress(input);
    assert(encoded === "", "Empty string should encode to empty bitstring");
    const output = decompress(encoded, tree);
    assert(output === input, "Decompression of empty string failed");
}

// Test 2: Single character repeated
{
    const input = "aaaaaa";
    const { encoded, tree } = compress(input);
    // With a single symbol, the code should be "0"
    const expectedBits = "0".repeat(input.length);
    assert(encoded === expectedBits, "Single‑character encoding mismatch");
    const output = decompress(encoded, tree);
    assert(output === input, "Decompression of single‑character string failed");
}

// Test 3: Typical sentence
{
    const input = "this is an example for huffman encoding";
    const { encoded, tree } = compress(input);
    const output = decompress(encoded, tree);
    assert(output === input, "Round‑trip failed for typical sentence");
}

// Test 4: Unicode characters (emoji & accented)
{
    const input = "😀😃😄😁😆😀😀éèêëēėę";
    const { encoded, tree } = compress(input);
    const output = decompress(encoded, tree);
    assert(output === input, "Round‑trip failed for Unicode characters");
}

// Test 5: Prefix‑free property of generated codes
{
    const input = "abracadabra";
    const { tree } = compress(input);
    const codes = generateCodes(tree);
    const codeArray = Array.from(codes.values());
    for (let i = 0; i < codeArray.length; i++) {
        for (let j = 0; j < codeArray.length; j++) {
            if (i === j) continue;
            const a = codeArray[i];
            const b = codeArray[j];
            assert(!b.startsWith(a), `Code "${a}" is a prefix of "${b}"`);
        }
    }
}

// Test 6: Large random string (deterministic)
{
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let input = "";
    for (let i = 0; i < 1000; i++) {
        input += chars[i % chars.length];
    }
    const { encoded, tree } = compress(input);
    const output = decompress(encoded, tree);
    assert(output === input, "Round‑trip failed for large deterministic string");
}

/* ---------- Demo ---------- */
function demo(): void {
    const sample = "the quick brown fox jumps over the lazy dog";
    console.log("Original:", sample);
    const { encoded, tree } = compress(sample);
    console.log("Encoded bitstring length:", encoded.length);
    console.log("Encoded (first 64 bits):", encoded.slice(0, 64) + (encoded.length > 64 ? "…" : ""));
    const decoded = decompress(encoded, tree);
    console.log("Decoded :", decoded);
    assert(decoded === sample, "Demo round‑trip failed");
}

demo();

console.log("All tests passed.");
