import {
    TransformerEncoder,
    TransformerConfig,
    Tensor
} from "./core.ts";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Helper to compare two matrices within tolerance
function matricesClose(a: number[][], b: number[][], eps = 1e-5): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].length !== b[i].length) return false;
        for (let j = 0; j < a[i].length; j++) {
            if (Math.abs(a[i][j] - b[i][j]) > eps) return false;
        }
    }
    return true;
}

// Unit test 1: softmax rows sum to 1
(function testSoftmaxRows() {
    const m = [
        [1, 2, 3],
        [0, 0, 0],
        [-1, -2, -3]
    ];
    const sm = Tensor.softmaxRows(m);
    for (const row of sm) {
        const sum = row.reduce((a, b) => a + b, 0);
        assert(Math.abs(sum - 1) < 1e-9, "Softmax row does not sum to 1");
    }
})();

// Unit test 2: scaled dot‑product attention on a tiny example
(function testAttentionSingleHead() {
    const cfg: TransformerConfig = {
        dModel: 4,
        nHead: 1,
        dFF: 8,
        seqLen: 2
    };
    const mha = new (require("./core.ts").MultiHeadAttention)(cfg);
    // Override weights to identity for deterministic behavior
    mha['wQ'] = Tensor.zeros(4, 4).map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
    mha['wK'] = Tensor.zeros(4, 4).map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
    mha['wV'] = Tensor.zeros(4, 4).map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
    mha['wO'] = Tensor.zeros(4, 4).map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));

    const x = [
        [1, 0, 0, 0],
        [0, 1, 0, 0]
    ]; // (2 x 4)

    const out = mha.forward(x);
    // With identity weights and two orthogonal inputs, attention should return the inputs unchanged
    assert(matricesClose(out, x), "Attention output differs from expected identity behavior");
})();

// Unit test 3: transformer encoder forward shape consistency
(function testTransformerEncoderShape() {
    const cfg: TransformerConfig = {
        dModel: 8,
        nHead: 2,
        dFF: 16,
        seqLen: 3
    };
    const encoder = new TransformerEncoder(cfg, 2);
    const input = [
        [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
        [0.2, 0.1, 0.4, 0.3, 0.6, 0.5, 0.8, 0.7],
        [0.3, 0.4, 0.1, 0.2, 0.7, 0.8, 0.5, 0.6]
    ]; // (3 x 8)

    const out = encoder.forward(input);
    assert(out.length === cfg.seqLen, "Output sequence length mismatch");
    assert(out[0].length === cfg.dModel, "Output embedding dimension mismatch");
})();

// Benchmark: simple timing of a forward pass (deterministic, no external libs)
(function benchmark() {
    const cfg: TransformerConfig = {
        dModel: 64,
        nHead: 8,
        dFF: 256,
        seqLen: 32
    };
    const encoder = new TransformerEncoder(cfg, 4);
    const input = Tensor.zeros(cfg.seqLen, cfg.dModel);
    // Fill with deterministic values
    let cnt = 1;
    for (let i = 0; i < cfg.seqLen; i++) {
        for (let j = 0; j < cfg.dModel; j++) {
            input[i][j] = (cnt++) * 0.001;
        }
    }
    const start = Date.now();
    const out = encoder.forward(input);
    const elapsed = Date.now() - start;
    console.log(`Benchmark: ${cfg.seqLen}×${cfg.dModel} → ${out.length}×${out[0].length} in ${elapsed} ms`);
})();

console.log("All tests passed.");
