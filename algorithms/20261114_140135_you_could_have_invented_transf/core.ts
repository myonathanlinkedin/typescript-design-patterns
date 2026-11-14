export type Matrix = number[][];
export type Vector = number[];

export class Tensor {
    static zeros(rows: number, cols: number): Matrix {
        const m: Matrix = [];
        for (let i = 0; i < rows; i++) {
            m.push(new Array(cols).fill(0));
        }
        return m;
    }

    static matMul(a: Matrix, b: Matrix): Matrix {
        const aRows = a.length;
        const aCols = a[0].length;
        const bRows = b.length;
        const bCols = b[0].length;
        if (aCols !== bRows) {
            throw new Error(`Incompatible dimensions for matMul: (${aRows}x${aCols})·(${bRows}x${bCols})`);
        }
        const result: Matrix = Tensor.zeros(aRows, bCols);
        for (let i = 0; i < aRows; i++) {
            for (let k = 0; k < aCols; k++) {
                const aik = a[i][k];
                for (let j = 0; j < bCols; j++) {
                    result[i][j] += aik * b[k][j];
                }
            }
        }
        return result;
    }

    static transpose(m: Matrix): Matrix {
        const rows = m.length;
        const cols = m[0].length;
        const t: Matrix = Tensor.zeros(cols, rows);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                t[j][i] = m[i][j];
            }
        }
        return t;
    }

    static add(a: Matrix, b: Matrix): Matrix {
        const rows = a.length;
        const cols = a[0].length;
        const out: Matrix = Tensor.zeros(rows, cols);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                out[i][j] = a[i][j] + b[i][j];
            }
        }
        return out;
    }

    static scale(m: Matrix, scalar: number): Matrix {
        const rows = m.length;
        const cols = m[0].length;
        const out: Matrix = Tensor.zeros(rows, cols);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                out[i][j] = m[i][j] * scalar;
            }
        }
        return out;
    }

    static softmaxRows(m: Matrix): Matrix {
        const rows = m.length;
        const cols = m[0].length;
        const out: Matrix = Tensor.zeros(rows, cols);
        for (let i = 0; i < rows; i++) {
            const row = m[i];
            const max = Math.max(...row);
            const exps = row.map(v => Math.exp(v - max));
            const sum = exps.reduce((a, b) => a + b, 0);
            for (let j = 0; j < cols; j++) {
                out[i][j] = exps[j] / sum;
            }
        }
        return out;
    }

    static layerNorm(m: Matrix, epsilon = 1e-5): Matrix {
        const rows = m.length;
        const cols = m[0].length;
        const out: Matrix = Tensor.zeros(rows, cols);
        for (let i = 0; i < rows; i++) {
            const row = m[i];
            const mean = row.reduce((a, b) => a + b, 0) / cols;
            const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / cols;
            const denom = Math.sqrt(variance + epsilon);
            for (let j = 0; j < cols; j++) {
                out[i][j] = (row[j] - mean) / denom;
            }
        }
        return out;
    }
}

export interface TransformerConfig {
    dModel: number;          // embedding dimension
    nHead: number;           // number of attention heads
    dFF: number;             // feed‑forward hidden dimension
    seqLen: number;          // maximum sequence length
}

export class MultiHeadAttention {
    private wQ: Matrix;
    private wK: Matrix;
    private wV: Matrix;
    private wO: Matrix;
    private headDim: number;
    private scale: number;

    constructor(private cfg: TransformerConfig) {
        const { dModel, nHead } = cfg;
        if (dModel % nHead !== 0) {
            throw new Error('dModel must be divisible by nHead');
        }
        this.headDim = dModel / nHead;
        this.scale = 1 / Math.sqrt(this.headDim);
        // Initialize weight matrices with simple deterministic values
        this.wQ = this.initWeight(dModel, dModel);
        this.wK = this.initWeight(dModel, dModel);
        this.wV = this.initWeight(dModel, dModel);
        this.wO = this.initWeight(dModel, dModel);
    }

    private initWeight(inDim: number, outDim: number): Matrix {
        const w: Matrix = Tensor.zeros(inDim, outDim);
        let counter = 1;
        for (let i = 0; i < inDim; i++) {
            for (let j = 0; j < outDim; j++) {
                w[i][j] = (counter++) * 0.01; // deterministic small values
            }
        }
        return w;
    }

    // Split a (seqLen x dModel) matrix into nHead tensors of shape (seqLen x headDim)
    private splitHeads(x: Matrix): Matrix[] {
        const { seqLen, nHead } = this.cfg;
        const heads: Matrix[] = [];
        for (let h = 0; h < nHead; h++) {
            const head: Matrix = Tensor.zeros(seqLen, this.headDim);
            for (let i = 0; i < seqLen; i++) {
                for (let j = 0; j < this.headDim; j++) {
                    head[i][j] = x[i][h * this.headDim + j];
                }
            }
            heads.push(head);
        }
        return heads;
    }

    // Concatenate heads back to (seqLen x dModel)
    private concatHeads(heads: Matrix[]): Matrix {
        const { seqLen, nHead } = this.cfg;
        const out: Matrix = Tensor.zeros(seqLen, this.cfg.dModel);
        for (let h = 0; h < nHead; h++) {
            const head = heads[h];
            for (let i = 0; i < seqLen; i++) {
                for (let j = 0; j < this.headDim; j++) {
                    out[i][h * this.headDim + j] = head[i][j];
                }
            }
        }
        return out;
    }

    // Scaled dot‑product attention for a single head
    private attention(q: Matrix, k: Matrix, v: Matrix): Matrix {
        // q, k, v: (seqLen x headDim)
        const kT = Tensor.transpose(k); // (headDim x seqLen)
        let scores = Tensor.matMul(q, kT); // (seqLen x seqLen)
        scores = Tensor.scale(scores, this.scale);
        const probs = Tensor.softmaxRows(scores); // (seqLen x seqLen)
        const out = Tensor.matMul(probs, v); // (seqLen x headDim)
        return out;
    }

    forward(x: Matrix): Matrix {
        // x: (seqLen x dModel)
        const q = Tensor.matMul(x, this.wQ);
        const k = Tensor.matMul(x, this.wK);
        const v = Tensor.matMul(x, this.wV);
        const qHeads = this.splitHeads(q);
        const kHeads = this.splitHeads(k);
        const vHeads = this.splitHeads(v);
        const outHeads: Matrix[] = [];
        for (let h = 0; h < this.cfg.nHead; h++) {
            outHeads.push(this.attention(qHeads[h], kHeads[h], vHeads[h]));
        }
        const concat = this.concatHeads(outHeads);
        const out = Tensor.matMul(concat, this.wO);
        return out;
    }
}

export class FeedForward {
    private w1: Matrix;
    private w2: Matrix;
    private b1: Vector;
    private b2: Vector;

    constructor(private cfg: TransformerConfig) {
        this.w1 = this.initWeight(cfg.dModel, cfg.dFF);
        this.w2 = this.initWeight(cfg.dFF, cfg.dModel);
        this.b1 = new Array(cfg.dFF).fill(0);
        this.b2 = new Array(cfg.dModel).fill(0);
    }

    private initWeight(inDim: number, outDim: number): Matrix {
        const w: Matrix = Tensor.zeros(inDim, outDim);
        let counter = 1;
        for (let i = 0; i < inDim; i++) {
            for (let j = 0; j < outDim; j++) {
                w[i][j] = (counter++) * 0.01;
            }
        }
        return w;
    }

    private gelu(x: number): number {
        // Approximation of GELU
        return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
    }

    forward(x: Matrix): Matrix {
        // x: (seqLen x dModel)
        const seqLen = x.length;
        const hidden = Tensor.add(Tensor.matMul(x, this.w1), Tensor.scale([this.b1], 1)[0].map(() => 0)); // bias ignored for simplicity
        // Apply GELU element‑wise
        for (let i = 0; i < seqLen; i++) {
            for (let j = 0; j < this.cfg.dFF; j++) {
                hidden[i][j] = this.gelu(hidden[i][j]);
            }
        }
        const out = Tensor.matMul(hidden, this.w2);
        return out;
    }
}

export class TransformerEncoderLayer {
    private mha: MultiHeadAttention;
    private ffn: FeedForward;

    constructor(private cfg: TransformerConfig) {
        this.mha = new MultiHeadAttention(cfg);
        this.ffn = new FeedForward(cfg);
    }

    forward(x: Matrix): Matrix {
        // Self‑attention + residual + layer‑norm
        const attn = this.mha.forward(x);
        const attnRes = Tensor.add(x, attn);
        const attnNorm = Tensor.layerNorm(attnRes);
        // Feed‑forward + residual + layer‑norm
        const ffnOut = this.ffn.forward(attnNorm);
        const ffnRes = Tensor.add(attnNorm, ffnOut);
        const out = Tensor.layerNorm(ffnRes);
        return out;
    }
}

export class TransformerEncoder {
    private layers: TransformerEncoderLayer[];

    constructor(private cfg: TransformerConfig, depth: number) {
        this.layers = [];
        for (let i = 0; i < depth; i++) {
            this.layers.push(new TransformerEncoderLayer(cfg));
        }
    }

    forward(x: Matrix): Matrix {
        let out = x;
        for (const layer of this.layers) {
            out = layer.forward(out);
        }
        return out;
    }
}
