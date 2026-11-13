export type ODEFunction = (t: number, y: number[]) => number[];

export interface RK4StepResult {
    t: number;
    y: number[];
}

export interface RK4IntegrationResult {
    steps: RK4StepResult[];
}
