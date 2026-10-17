import { WeightPacket, ModelConfig, InferenceState } from "./types";

/**
 * Creates a fresh inference state for a model described by `config`.
 * The state holds only the partial output vector; the full weight matrix is never stored.
 */
export function createInferenceState(config: ModelConfig): InferenceState {
    return {
        outputs: new Array(config.outputSize).fill(0),
        rowsProcessed: 0,
    };
}

/**
 * Validates that a weight packet conforms to the model configuration.
 * Throws a descriptive Error if validation fails.
 */
export function validatePacket(packet: WeightPacket, config: ModelConfig): void {
    if (packet.rowIndex < 0 || packet.rowIndex >= config.outputSize) {
        throw new Error(`WeightPacket.rowIndex ${packet.rowIndex} out of bounds for outputSize ${config.outputSize}`);
    }
    if (packet.values.length !== config.inputSize + 1) {
        throw new Error(
            `WeightPacket.values length ${packet.values.length} does not match expected ${config.inputSize + 1}`
        );
    }
}

/**
 * Processes a single weight packet, updating the inference state.
 *
 * The packet contains a full row of the weight matrix (including bias as the last element).
 * The function computes:
 *   output[row] = dot(rowWeights, input) + bias
 *
 * @param state   Mutable inference state to update.
 * @param packet  Weight packet to process.
 * @param input   Input feature vector; length must equal config.inputSize.
 * @param config  Model configuration.
 */
export function processWeightPacket(
    state: InferenceState,
    packet: WeightPacket,
    input: readonly number[],
    config: ModelConfig
): void {
    validatePacket(packet, config);
    if (input.length !== config.inputSize) {
        throw new Error(`Input length ${input.length} does not match expected ${config.inputSize}`);
    }

    const rowIdx = packet.rowIndex;
    const rowWeights = packet.values.slice(0, config.inputSize);
    const bias = packet.values[config.inputSize];

    let sum = bias;
    for (let i = 0; i < config.inputSize; i++) {
        sum += rowWeights[i] * input[i];
    }
    state.outputs[rowIdx] = sum;
    state.rowsProcessed += 1;
}

/**
 * Finalizes inference after all packets have been processed.
 * Returns the output vector. Performs a sanity check that every row was processed.
 *
 * @param state   Completed inference state.
 * @param config  Model configuration.
 * @returns       Output vector of length config.outputSize.
 */
export function finalizeInference(state: InferenceState, config: ModelConfig): number[] {
    if (state.rowsProcessed !== config.outputSize) {
        throw new Error(
            `Incomplete inference: processed ${state.rowsProcessed} rows but expected ${config.outputSize}`
        );
    }
    // Return a shallow copy to preserve immutability of the state for callers.
    return state.outputs.slice();
}

/**
 * Convenience function that runs the full streaming inference pipeline:
 *   1. Creates a fresh state.
 *   2. Feeds each packet in order.
 *   3. Returns the final output vector.
 *
 * @param packets Ordered array of weight packets (order does not matter for correctness).
 * @param input   Input feature vector.
 * @param config  Model configuration.
 * @returns       Output vector.
 */
export function runStreamingInference(
    packets: readonly WeightPacket[],
    input: readonly number[],
    config: ModelConfig
): number[] {
    const state = createInferenceState(config);
    for (const pkt of packets) {
        processWeightPacket(state, pkt, input, config);
    }
    return finalizeInference(state, config);
}
