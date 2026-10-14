import { assert } from "node:assert";
import {
    WeightPacket,
    ModelConfig,
    InferenceState,
} from "./types";
import {
    createInferenceState,
    processWeightPacket,
    finalizeInference,
    runStreamingInference,
} from "./engine";

/* ---------- Helper: direct matrix multiplication for verification ---------- */
function directMatMul(weights: number[][], bias: number[], input: number[]): number[] {
    const output: number[] = [];
    for (let row = 0; row < weights.length; row++) {
        let sum = bias[row];
        for (let col = 0; col < input.length; col++) {
            sum += weights[row][col] * input[col];
        }
        output.push(sum);
    }
    return output;
}

/* --------------------------- Unit Tests --------------------------------- */
function testSimpleModel(): void {
    // Model: 2 inputs, 3 outputs
    const config: ModelConfig = { inputSize: 2, outputSize: 3 };
    const input = [1.5, -0.5];

    // Define weight matrix and bias vector
    const weightMatrix = [
        [0.2, 0.8],
        [-0.5, 1.0],
        [0.0, -1.2],
    ];
    const bias = [0.1, -0.2, 0.3];

    // Build packets (row‑wise, bias appended)
    const packets: WeightPacket[] = weightMatrix.map((row, idx) => ({
        rowIndex: idx,
        values: [...row, bias[idx]],
    }));

    // Run streaming inference
    const streamed = runStreamingInference(packets, input, config);

    // Expected result via direct multiplication
    const expected = directMatMul(weightMatrix, bias, input);

    assert.deepStrictEqual(streamed, expected, "Streaming inference does not match direct multiplication");
}

function testOutOfOrderPackets(): void {
    const config: ModelConfig = { inputSize: 3, outputSize: 2 };
    const input = [2, -1, 0.5];

    const weightMatrix = [
        [1, 0, -1],
        [0.5, 0.5, 0.5],
    ];
    const bias = [0, 1];

    // Create packets out of order
    const packets: WeightPacket[] = [
        { rowIndex: 1, values: [...weightMatrix[1], bias[1]] },
        { rowIndex: 0, values: [...weightMatrix[0], bias[0]] },
    ];

    const streamed = runStreamingInference(packets, input, config);
    const expected = directMatMul(weightMatrix, bias, input);
    assert.deepStrictEqual(streamed, expected, "Out‑of‑order packets should still produce correct output");
}

function testInvalidPacketLength(): void {
    const config: ModelConfig = { inputSize: 2, outputSize: 1 };
    const input = [0, 0];
    const badPacket: WeightPacket = { rowIndex: 0, values: [1] }; // too short

    const state = createInferenceState(config);
    let caught = false;
    try {
        processWeightPacket(state, badPacket, input, config);
    } catch (e) {
        caught = true;
        assert.ok(
            (e as Error).message.includes("WeightPacket.values length"),
            "Error message should mention values length"
        );
    }
    assert.ok(caught, "Invalid packet length must raise an error");
}

function testIncompleteInference(): void {
    const config: ModelConfig = { inputSize: 1, outputSize: 2 };
    const input = [3];
    const packets: WeightPacket[] = [
        { rowIndex: 0, values: [2, 0] }, // only one row provided
    ];
    const state = createInferenceState(config);
    processWeightPacket(state, packets[0], input, config);
    let caught = false;
    try {
        finalizeInference(state, config);
    } catch (e) {
        caught = true;
        assert.ok(
            (e as Error).message.includes("Incomplete inference"),
            "Error should indicate incomplete inference"
        );
    }
    assert.ok(caught, "Finalizing with missing rows must raise an error");
}

/* --------------------------- Demo --------------------------------------- */
function demo(): void {
    console.log("=== AIR‑LLM Streaming Inference Demo ===");
    const config: ModelConfig = { inputSize: 4, outputSize: 2 };
    const input = [0.5, -1.2, 3.0, 0.0];

    const weightMatrix = [
        [0.1, 0.2, -0.3, 0.4],
        [-0.5, 0.6, 0.7, -0.8],
    ];
    const bias = [0.05, -0.05];

    const packets: WeightPacket[] = weightMatrix.map((row, idx) => ({
        rowIndex: idx,
        values: [...row, bias[idx]],
    }));

    const output = runStreamingInference(packets, input, config);
    console.log("Input :", input);
    console.log("Output:", output);
}

/* --------------------------- Execute Tests ----------------------------- */
function runAllTests(): void {
    testSimpleModel();
    testOutOfOrderPackets();
    testInvalidPacketLength();
    testIncompleteInference();
    console.log("All unit tests passed.");
}

runAllTests();
demo();
