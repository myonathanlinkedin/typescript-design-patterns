import { ScoringEngine } from './engine';
import { Player } from './types';

// Simple assertion helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Helper to simulate a sequence of points
function playSequence(engine: ScoringEngine, seq: Player[]): void {
  for (const p of seq) {
    engine.pointWonBy(p);
  }
}

// Unit Tests
(function runTests() {
  // Test 1: Basic point progression A:15, B:0
  const eng1 = new ScoringEngine();
  playSequence(eng1, ['A']);
  assert(eng1.getScore() === '0-0, 0-0, 15-0', 'Test 1 failed');

  // Test 2: Progress to 30-15
  const eng2 = new ScoringEngine();
  playSequence(eng2, ['A', 'A', 'B']);
  assert(eng2.getScore() === '0-0, 0-0, 30-15', 'Test 2 failed');

  // Test 3: Deuce and Advantage
  const eng3 = new ScoringEngine();
  playSequence(eng3, ['A','A','A','B','B','B']);
  // Score should be Deuce
  assert(eng3.getScore() === '0-0, 0-0, Deuce', 'Test 3 Deuce failed');
  // Advantage A
  eng3.pointWonBy('A');
  assert(eng3.getScore() === '0-0, 0-0, Advantage A', 'Test 3 Adv A failed');
  // Back to Deuce
  eng3.pointWonBy('B');
  assert(eng3.getScore() === '0-0, 0-0, Deuce', 'Test 3 Back to Deuce failed');
  // Advantage B
  eng3.pointWonBy('B');
  assert(eng3.getScore() === '0-0, 0-0, Advantage B', 'Test 3 Adv B failed');
  // Game B wins
  eng3.pointWonBy('B');
  assert(eng3.getScore() === '0-0, 0-1, 0-0', 'Test 3 Game win failed');

  // Test 4: Simple set win (6-0)
  const eng4 = new ScoringEngine();
  for (let i = 0; i < 6; i++) {
    // each game: A wins 4 points straight
    playSequence(eng4, ['A','A','A','A']);
  }
  assert(eng4.getScore() === '1-0, 0-0, 0-0', 'Test 4 set win failed');

  // Test 5: Tie‑break scenario (7-6)
  const eng5 = new ScoringEngine();
  // Reach 6‑6 in games
  for (let i = 0; i < 6; i++) {
    playSequence(eng5, ['A','A','A','A']); // A wins game
    playSequence(eng5, ['B','B','B','B']); // B wins game
  }
  // Verify tie‑break started
  assert(eng5.getScore() === '0-0, 6-6, 0-0', 'Test 5 tie‑break start failed');
  // Play tie‑break points: A wins 7‑5
  const tieBreakSeq: Player[] = [
    'A','B','A','B','A','B','A','A','A' // A reaches 7, B 5
  ];
  playSequence(eng5, tieBreakSeq);
  // After tie‑break, A should have won the set 7‑6
  assert(eng5.getScore() === '1-0, 0-0, 0-0', 'Test 5 set after tie‑break failed');

  // Test 6: Full match (best of 3 sets) – A wins 2‑0
  const eng6 = new ScoringEngine();
  // First set 6‑0
  for (let i = 0; i < 6; i++) {
    playSequence(eng6, ['A','A','A','A']);
  }
  // Second set 6‑0
  for (let i = 0; i < 6; i++) {
    playSequence(eng6, ['A','A','A','A']);
  }
  assert(eng6.getScore() === 'Match over. Winner: A', 'Test 6 match over failed');

  console.log('All tests passed.');
})();
