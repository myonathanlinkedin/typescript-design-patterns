export interface WeightPacket {
    /** Zero‑based row index of the weight matrix this packet represents */
    rowIndex: number;
    /** Weight values for this row, length must equal inputSize + 1 (last entry is bias) */
    values: readonly number[];
}

export interface ModelConfig {
    /** Number of input features (excluding bias) */
    inputSize: number;
    /** Number of output neurons (i.e., rows in the weight matrix) */
    outputSize: number;
}

/** Mutable state used while streaming weight packets for inference */
export interface InferenceState {
    /** Accumulated output values for each neuron; length = outputSize */
    outputs: number[];
    /** Number of rows that have been processed so far */
    rowsProcessed: number;
}
