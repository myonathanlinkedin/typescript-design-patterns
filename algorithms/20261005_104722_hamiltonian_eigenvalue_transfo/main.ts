import { TridiagonalMatrix, HamiltonianSolver, EigenResult } from './core';

// Unit Test Suite
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function assertClose(a: number, b: number, epsilon: number = 1e-10, message?: string): void {
    if (Math.abs(a - b) > epsilon) {
        throw new Error(`Values not close: ${a} vs ${b} (diff: ${Math.abs(a - b)}). ${message || ''}`);
    }
}

function test1x1Matrix(): void {
    const matrix: TridiagonalMatrix = {
        n: 1,
        a: [5.0],
        b: []
    };
    const solver = new HamiltonianSolver(matrix);
    const result = solver.solve();

    assert(result.eigenvalues.length === 1, "1x1 matrix should have 1 eigenvalue");
    assertClose(result.eigenvalues[0], 5.0, 1e-10, "1x1 eigenvalue");
    assert(result.eigenvectors.length === 1, "1x1 matrix should have 1 eigenvector");
    assert(result.eigenvectors[0].length === 1, "Eigenvector should be 1D");
    assertClose(result.eigenvectors[0][0], 1.0, 1e-10, "1x1 eigenvector");
    console.log("✓ Test 1x1 Matrix Passed");
}

function test2x2Matrix(): void {
    const matrix: TridiagonalMatrix = {
        n: 2,
        a: [2.0, 3.0],
        b: [1.0]
    };
    const solver = new HamiltonianSolver(matrix);
    const result = solver.solve();

    // Eigenvalues of [[2,1],[1,3]] are (5±√5)/2 ≈ 1.382, 3.618
    assert(result.eigenvalues.length === 2, "2x2 matrix should have 2 eigenvalues");
    assertClose(result.eigenvalues[0], (5 - Math.sqrt(5)) / 2, 1e-10, "2x2 eigenvalue 1");
    assertClose(result.eigenvalues[1], (5 + Math.sqrt(5)) / 2, 1e-10, "2x2 eigenvalue 2");
    console.log("✓ Test 2x2 Matrix Passed");
}

function test3x3Matrix(): void {
    const matrix: TridiagonalMatrix = {
        n: 3,
        a: [1.0, 2.0, 3.0],
        b: [1.0, 1.0]
    };
    const solver = new HamiltonianSolver(matrix);
    const result = solver.solve();

    assert(result.eigenvalues.length === 3, "3x3 matrix should have 3 eigenvalues");
    // Verify eigenvalues are sorted
    assert(result.eigenvalues[0] <= result.eigenvalues[1], "Eigenvalues should be sorted");
    assert(result.eigenvalues[1] <= result.eigenvalues[2], "Eigenvalues should be sorted");
    console.log("✓ Test 3x3 Matrix Passed");
}

function testOrthogonality(): void {
    const n = 5;
    const matrix: TridiagonalMatrix = {
        n: n,
        a: Array.from({ length: n }, (_, i) => i + 1),
        b: Array.from({ length: n - 1 }, () => 0.5)
    };
    const solver = new HamiltonianSolver(matrix);
    const result = solver.solve();

    // Check orthogonality of eigenvectors
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            let dot = 0;
            for (let k = 0; k < n; k++) {
                dot += result.eigenvectors[i][k] * result.eigenvectors[j][k];
            }
            assertClose(dot, 0.0, 1e-10, `Eigenvectors ${i} and ${j} should be orthogonal`);
        }
    }
    console.log("✓ Test Orthogonality Passed");
}

function testEigenvalueEquation(): void {
    const n = 4;
    const matrix: TridiagonalMatrix = {
        n: n,
        a: [2.0, -1.0, 3.0, 1.0],
        b: [1.0, 2.0, 0.5]
    };
    const solver = new HamiltonianSolver(matrix);
    const result = solver.solve();

    // Verify Av = λv for each eigenpair
    for (let i = 0; i < n; i++) {
        const lambda = result.eigenvalues[i];
        const v = result.eigenvectors[i];
        for (let row = 0; row < n; row++) {
            let sum = 0;
            if (row > 0) sum += matrix.b[row - 1] * v[row - 1];
            sum += matrix.a[row] * v[row];
            if (row < n - 1) sum += matrix.b[row] * v[row + 1];
            assertClose(sum, lambda * v[row], 1e-10, `Eigenvalue equation for row ${row}, eigenpair ${i}`);
        }
    }
    console.log("✓ Test Eigenvalue Equation Passed");
}

function testLargeMatrix(): void {
    const n = 50;
    const matrix: TridiagonalMatrix = {
        n: n,
        a: Array.from({ length: n }, (_, i) => Math.sin(i * 0.1)),
        b: Array.from({ length: n - 1 }, (_, i) => Math.cos(i * 0.2))
    };
    const solver = new HamiltonianSolver(matrix);
    const result = solver.solve();

    assert(result.eigenvalues.length === n, "Large matrix should have n eigenvalues");
    assert(result.eigenvectors.length === n, "Large matrix should have n eigenvectors");
    assert(result.eigenvectors[0].length === n, "Eigenvectors should be n-dimensional");
    console.log("✓ Test Large Matrix Passed");
}

function testSymmetry(): void {
    const n = 6;
    const matrix: TridiagonalMatrix = {
        n: n,
        a: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        b: [0.5, 0.5, 0.5, 0.5, 0.5]
    };
    const solver = new HamiltonianSolver(matrix);
    const result = solver.solve();

    // All eigenvalues should be real (which they are by construction)
    for (const lambda of result.eigenvalues) {
        assert(Number.isFinite(lambda), "Eigenvalues should be finite");
    }
    console.log("✓ Test Symmetry Passed");
}

// Benchmark
function benchmark(): void {
    const sizes = [10, 50, 100, 500];
    console.log("\n--- Benchmark ---");
    for (const n of sizes) {
        const matrix: TridiagonalMatrix = {
            n: n,
            a: Array.from({ length: n }, (_, i) => Math.random() * 10 - 5),
            b: Array.from({ length: n - 1 }, () => Math.random() * 2 - 1)
        };
        const solver = new HamiltonianSolver(matrix);
        const start = performance.now();
        const result = solver.solve();
        const end = performance.now();
        console.log(`n=${n}: ${(end - start).toFixed(2)}ms, eigenvalues: ${result.eigenvalues.length}`);
    }
}

// Main entry point
function main(): void {
    console.log("Hamiltonian Eigenvalue Solver - Test Suite\n");
    
    test1x1Matrix();
    test2x2Matrix();
    test3x3Matrix();
    testOrthogonality();
    testEigenvalueEquation();
    testLargeMatrix();
    testSymmetry();
    
    console.log("\n✓ All tests passed!");
    
    benchmark();
}

main();
