export interface TridiagonalMatrix {
    n: number;
    a: number[]; // Diagonal elements
    b: number[]; // Off-diagonal elements (length n-1)
}

export interface EigenResult {
    eigenvalues: number[];
    eigenvectors: number[][]; // Columns are eigenvectors
}

export class HamiltonianSolver {
    private readonly n: number;
    private readonly a: number[];
    private readonly b: number[];

    constructor(matrix: TridiagonalMatrix) {
        this.n = matrix.n;
        this.a = [...matrix.a];
        this.b = [...matrix.b];
    }

    /**
     * Computes eigenvalues and eigenvectors using the QL algorithm with implicit shifts.
     * This is the standard numerical method for symmetric tridiagonal matrices.
     */
    solve(): EigenResult {
        if (this.n === 0) {
            return { eigenvalues: [], eigenvectors: [] };
        }

        // Initialize eigenvectors as identity matrix
        const v: number[][] = Array.from({ length: this.n }, (_, i) =>
            Array.from({ length: this.n }, (_, j) => (i === j ? 1 : 0))
        );

        // Copy matrix data for in-place modification
        const d = [...this.a];
        const e = [...this.b];

        // Step 1: Reduce to tridiagonal form (already tridiagonal, so this is a no-op
        // but we ensure the structure is correct for the QL algorithm)
        // The QL algorithm works directly on the tridiagonal form.

        // Step 2: Apply QL algorithm with implicit shifts
        this.qlAlgorithm(d, e, v);

        // Sort eigenvalues and eigenvectors in ascending order
        const indices = d.map((_, i) => i).sort((i, j) => d[i] - d[j]);
        const sortedEigenvalues = indices.map(i => d[i]);
        const sortedEigenvectors = indices.map(i => v.map(row => row[i]));

        return {
            eigenvalues: sortedEigenvalues,
            eigenvectors: sortedEigenvectors
        };
    }

    private qlAlgorithm(d: number[], e: number[], v: number[][]): void {
        const n = this.n;
        const eps = 1e-15;

        for (let l = 0; l < n; l++) {
            // Find small sub-diagonal element e[m]
            let m = l;
            while (m < n - 1) {
                const dd = Math.abs(d[m]) + Math.abs(d[m + 1]);
                if (Math.abs(e[m]) <= eps * dd) break;
                m++;
            }

            // If m == l, we are done with this eigenvalue
            if (m !== l) {
                do {
                    let i = l;
                    while (i < m) {
                        if (Math.abs(e[i]) <= eps * (Math.abs(d[i]) + Math.abs(d[i + 1]))) {
                            break;
                        }
                        i++;
                    }

                    if (i !== m) {
                        // Shift
                        const g = (d[l + 1] - d[l]) / (2.0 * e[l]);
                        const r = Math.sqrt(g * g + 1.0);
                        g = d[m] - d[l] + e[l] / (g + (g >= 0 ? r : -r));

                        let s = 1.0;
                        let c = 1.0;
                        let p = 0.0;

                        for (let k = m - 1; k >= l; k--) {
                            const f = s * e[k];
                            const bb = c * e[k];

                            // Rotate
                            const r = Math.hypot(f, g);
                            e[k + 1] = r;
                            if (r === 0.0) {
                                d[k + 1] -= p;
                                e[k] = 0.0;
                                break;
                            }

                            s = f / r;
                            c = g / r;
                            g = d[k + 1] - p;
                            const t = (d[k] - g) * s + 2.0 * c * bb;
                            p = s * t;
                            d[k + 1] = g + p;
                            g = c * t - bb;

                            // Accumulate transformations in v
                            for (let j = 0; j < n; j++) {
                                const fk = v[j][k + 1];
                                v[j][k + 1] = s * v[j][k] + c * fk;
                                v[j][k] = c * v[j][k] - s * fk;
                            }
                        }

                        if (p !== 0.0 && i === m) {
                            d[l] -= p;
                        }
                        e[i] = 0.0;
                        i = l;
                    }
                } while (m > l);
            }
        }
    }
}
