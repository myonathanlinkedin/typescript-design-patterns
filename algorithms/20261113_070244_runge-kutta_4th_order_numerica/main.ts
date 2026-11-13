import { ODEFunction } from "./types";
import { rk4Integrate, rk4Step } from "./engine";
import * as assert from "assert";

/**
 * Helper: compute Euclidean norm of a vector.
 */
function norm(v: number[]): number {
    return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

/**
 * Test 1: Scalar exponential growth dy/dt = y, y(0)=1 => y(t)=exp(t)
 */
function testExponential(): void {
    const f: ODEFunction = (t, y) => [y[0]];
    const t0 = 0;
    const y0 = [1];
    const h = 0.1;
    const steps = 100; // integrate to t = 10
    const result = rk4Integrate(f, t0, y0, h, steps);
    const final = result.steps[result.steps.length - 1];
    const expected = Math.exp(final.t);
    const error = Math.abs(final.y[0] - expected);
    // Tolerance chosen based on RK4 global error O(h^4)
    const tolerance = 1e-6;
    assert.ok(error < tolerance, `Exponential test failed: error=${error}`);
}

/**
 * Test 2: Simple harmonic oscillator
 *   dy1/dt = y2
 *   dy2/dt = -y1
 *   Exact solution: y1 = cos(t), y2 = -sin(t)
 */
function testHarmonicOscillator(): void {
    const f: ODEFunction = (t, y) => [y[1], -y[0]];
    const t0 = 0;
    const y0 = [1, 0]; // cos(0)=1, -sin(0)=0
    const h = 0.05;
    const steps = 200; // integrate to t = 10
    const result = rk4Integrate(f, t0, y0, h, steps);
    const final = result.steps[result.steps.length - 1];
    const t = final.t;
    const yExact = [Math.cos(t), -Math.sin(t)];
    const error = norm([final.y[0] - yExact[0], final.y[1] - yExact[1]]);
    const tolerance = 1e-5;
    assert.ok(error < tolerance, `Harmonic oscillator test failed: error=${error}`);
}

/**
 * Test 3: Edge cases – zero steps and negative step size handling.
 */
function testEdgeCases(): void {
    const f: ODEFunction = (t, y) => y.map(v => -v);
    const t0 = 0;
    const y0 = [5, -3];
    const h = 0.1;

    // Zero steps should return only the initial condition
    const zeroResult = rk4Integrate(f, t0, y0, h, 0);
    assert.strictEqual(zeroResult.steps.length, 1, "Zero steps length mismatch");
    assert.deepStrictEqual(zeroResult.steps[0].y, y0, "Zero steps state mismatch");

    // Negative step size must throw
    let threw = false;
    try {
        rk4Step(f, t0, y0, -0.1);
    } catch (e) {
        threw = true;
    }
    assert.ok(threw, "Negative step size did not throw");
}

/**
 * Demo driver – prints a short trajectory for dy/dt = -2y, y(0)=1.
 */
function demo(): void {
    const f: ODEFunction = (t, y) => [-2 * y[0]];
    const t0 = 0;
    const y0 = [1];
    const h = 0.2;
    const steps = 5;
    const result = rk4Integrate(f, t0, y0, h, steps);
    console.log("Demo: dy/dt = -2y, y(0)=1");
    for (const step of result.steps) {
        console.log(`t=${step.t.toFixed(2)}\t y=${step.y[0].toFixed(6)}`);
    }
}

/* Execute tests and demo */
function runAll(): void {
    testExponential();
    testHarmonicOscillator();
    testEdgeCases();
    console.log("All unit tests passed.");
    demo();
}

runAll();
