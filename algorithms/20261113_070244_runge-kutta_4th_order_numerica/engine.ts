import { ODEFunction, RK4StepResult, RK4IntegrationResult } from "./types";

/**
 * Perform a single RK4 integration step.
 * @param f ODE system function f(t, y) returning dy/dt.
 * @param t Current time.
 * @param y Current state vector.
 * @param h Step size (must be > 0).
 * @returns New time and state after one RK4 step.
 */
export function rk4Step(f: ODEFunction, t: number, y: number[], h: number): RK4StepResult {
    if (h <= 0) {
        throw new Error("Step size h must be positive.");
    }
    const n = y.length;
    const k1 = f(t, y);
    const yTemp1 = new Array<number>(n);
    for (let i = 0; i < n; i++) {
        yTemp1[i] = y[i] + (h / 2) * k1[i];
    }

    const k2 = f(t + h / 2, yTemp1);
    const yTemp2 = new Array<number>(n);
    for (let i = 0; i < n; i++) {
        yTemp2[i] = y[i] + (h / 2) * k2[i];
    }

    const k3 = f(t + h / 2, yTemp2);
    const yTemp3 = new Array<number>(n);
    for (let i = 0; i < n; i++) {
        yTemp3[i] = y[i] + h * k3[i];
    }

    const k4 = f(t + h, yTemp3);

    const yNext = new Array<number>(n);
    for (let i = 0; i < n; i++) {
        yNext[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }

    return { t: t + h, y: yNext };
}

/**
 * Integrate an ODE system using RK4 over a fixed number of steps.
 * @param f ODE system function.
 * @param t0 Initial time.
 * @param y0 Initial state vector.
 * @param h Step size (>0).
 * @param steps Number of integration steps (>=0).
 * @returns All intermediate states including the initial condition.
 */
export function rk4Integrate(
    f: ODEFunction,
    t0: number,
    y0: number[],
    h: number,
    steps: number
): RK4IntegrationResult {
    if (steps < 0) {
        throw new Error("Number of steps must be non‑negative.");
    }
    const result: RK4StepResult[] = [{ t: t0, y: y0.slice() }]; // deep copy of y0
    let t = t0;
    let y = y0.slice();

    for (let i = 0; i < steps; i++) {
        const step = rk4Step(f, t, y, h);
        result.push(step);
        t = step.t;
        y = step.y;
    }

    return { steps: result };
}
