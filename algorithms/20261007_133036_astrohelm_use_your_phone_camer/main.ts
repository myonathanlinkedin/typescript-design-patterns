import {
  EquatorialCoordinate,
  HorizontalCoordinate,
  Observer,
  raDecToAltAz,
  angularSeparation,
  aimAdjustment,
  normalizeAngle,
  normalizeAngle180,
} from "./core.ts";

/** Simple assertion helper */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

/** Approximate equality for floating point numbers */
function assertAlmostEqual(
  actual: number,
  expected: number,
  epsilon = 1e-6,
  message?: string
): void {
  const diff = Math.abs(actual - expected);
  assert(diff <= epsilon, message ?? `Expected ${expected}, got ${actual}`);
}

/** Unit Tests */
function runTests(): void {
  // Test normalizeAngle
  assert(normalizeAngle(370) === 10, "normalizeAngle 370");
  assert(normalizeAngle(-30) === 330, "normalizeAngle -30");
  // Test normalizeAngle180
  assert(normalizeAngle180(190) === -170, "normalizeAngle180 190");
  assert(normalizeAngle180(-190) === 170, "normalizeAngle180 -190");
  // Test angularSeparation identical points -> 0
  const p1: HorizontalCoordinate = { az: 45, alt: 30 };
  const p2: HorizontalCoordinate = { az: 45, alt: 30 };
  assertAlmostEqual(angularSeparation(p1, p2), 0, 1e-9, "sep same point");
  // Opposite points (approx 180°)
  const opp1: HorizontalCoordinate = { az: 0, alt: 0 };
  const opp2: HorizontalCoordinate = { az: 180, alt: 0 };
  assertAlmostEqual(angularSeparation(opp1, opp2), 180, 1e-6, "sep opposite");
  // Test aimAdjustment
  const cur: HorizontalCoordinate = { az: 10, alt: 20 };
  const tgt: HorizontalCoordinate = { az: 350, alt: 25 };
  const adj = aimAdjustment(cur, tgt);
  assertAlmostEqual(adj.deltaAz, -20, 1e-9, "deltaAz wrap");
  assertAlmostEqual(adj.deltaAlt, 5, 1e-9, "deltaAlt positive");
  // Test raDecToAltAz with known values
  // Observer at Greenwich (lat 51.4769°, lon 0°) on 2022-03-21 00:00:00 UTC
  const observer: Observer = { latitude: 51.4769, longitude: 0 };
  const date = new Date(Date.UTC(2022, 2, 21, 0, 0, 0));
  // Target: Vega (RA 18h 36m 56s ≈ 18.6156h, Dec +38° 47')
  const vega: EquatorialCoordinate = { ra: 18.6156, dec: 38.7837 };
  const horiz = raDecToAltAz(vega, observer, date);
  // Expected approximate values (from external calculator):
  // Alt ≈ 38°, Az ≈ 284°
  assertAlmostEqual(horiz.alt, 38, 1, "Vega altitude approx");
  assertAlmostEqual(normalizeAngle(horiz.az), 284, 2, "Vega azimuth approx");
  console.log("All tests passed.");
}

/** Demo usage */
function demo(): void {
  const observer: Observer = { latitude: 40.0, longitude: -74.0 }; // New York approx
  const now = new Date();
  const polaris: EquatorialCoordinate = {
    ra: 2 + 31 / 60, // 2h31m ≈ 2.5167h
    dec: 89.25, // 89°15'
  };
  const target = raDecToAltAz(polaris, observer, now);
  // Simulated current phone orientation (e.g., pointing slightly east of north)
  const current: HorizontalCoordinate = { az: 10, alt: 30 };
  const adjustment = aimAdjustment(current, target);
  console.log("Target Az/Alt:", target);
  console.log("Current Az/Alt:", current);
  console.log("Adjustment needed (ΔAz°, ΔAlt°):", adjustment);
}

/* Execute */
runTests();
demo();
