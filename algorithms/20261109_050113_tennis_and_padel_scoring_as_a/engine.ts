import { Player, GameScore, GamePoints } from './types';

const POINT_LABELS = ['0', '15', '30', '40'];

function newGameScore(): GameScore {
  return {
    points: { A: 0, B: 0 },
    games: { A: 0, B: 0 },
    sets: { A: 0, B: 0 },
    inTieBreak: false,
    matchOver: false,
  };
}

/**
 * Returns true if the player has won the current game (including advantage rules).
 */
function isGameWon(points: GamePoints, player: Player): boolean {
  const opponent: Player = player === 'A' ? 'B' : 'A';
  const p = points[player];
  const o = points[opponent];
  // Normal game win (no tie‑break)
  if (!points['tieBreak']) {
    return p >= 4 && p - o >= 2;
  }
  // Tie‑break win
  return p >= 7 && p - o >= 2;
}

/**
 * Returns true if the player has won the current set.
 */
function isSetWon(games: { A: number; B: number }, player: Player, inTieBreak: boolean): boolean {
  const opponent: Player = player === 'A' ? 'B' : 'A';
  const p = games[player];
  const o = games[opponent];
  if (inTieBreak) {
    // Set is decided by tie‑break winner, handled elsewhere.
    return false;
  }
  return p >= 6 && p - o >= 2;
}

/**
 * Returns true if the player has won the match (best of 3 sets).
 */
function isMatchWon(sets: { A: number; B: number }, player: Player): boolean {
  return sets[player] >= 2;
}

/**
 * Formats the point portion of a tennis/padel game.
 */
function formatPoints(points: GamePoints, inTieBreak: boolean): string {
  if (inTieBreak) {
    return `${points.A}-${points.B}`;
  }
  const a = points.A;
  const b = points.B;
  // Deuce
  if (a >= 3 && b >= 3) {
    if (a === b) return 'Deuce';
    const leader = a > b ? 'A' : 'B';
    return `Advantage ${leader}`;
  }
  const aLabel = POINT_LABELS[a] ?? '0';
  const bLabel = POINT_LABELS[b] ?? '0';
  return `${aLabel}-${bLabel}`;
}

/**
 * Formats the full match score.
 * Example: "1-0, 3-2, 15-30"
 *   where "1-0" = sets, "3-2" = games in current set, "15-30" = points.
 */
export function formatScore(state: GameScore): string {
  const setScore = `${state.sets.A}-${state.sets.B}`;
  const gameScore = `${state.games.A}-${state.games.B}`;
  const pointScore = formatPoints(state.points, state.inTieBreak);
  if (state.matchOver) {
    const winner: Player = state.sets.A > state.sets.B ? 'A' : 'B';
    return `Match over. Winner: ${winner}`;
  }
  return `${setScore}, ${gameScore}, ${pointScore}`;
}

/**
 * Core state‑machine: registers a point for the given player and updates the match state.
 */
export class ScoringEngine {
  private state: GameScore = newGameScore();

  public pointWonBy(player: Player): void {
    if (this.state.matchOver) return; // No further changes after match end.

    if (this.state.inTieBreak) {
      // Tie‑break point handling
      this.state.points[player] += 1;
      if (isGameWon(this.state.points, player)) {
        // Tie‑break winner also wins the set.
        this.state.sets[player] += 1;
        // Reset for next set or match end.
        this.resetForNextSetOrMatch();
      }
      return;
    }

    // Normal point handling
    this.state.points[player] += 1;

    if (isGameWon(this.state.points, player)) {
      // Game won
      this.state.games[player] += 1;
      // Reset points for next game
      this.state.points = { A: 0, B: 0 };

      // Check for tie‑break start
      if (this.state.games.A === 6 && this.state.games.B === 6) {
        this.state.inTieBreak = true;
        // Tie‑break points start at 0‑0
        this.state.points = { A: 0, B: 0 };
        return;
      }

      // Set win?
      if (isSetWon(this.state.games, player, false)) {
        this.state.sets[player] += 1;
        this.resetForNextSetOrMatch();
        return;
      }
    }
  }

  private resetForNextSetOrMatch(): void {
    // Determine if match is over
    if (isMatchWon(this.state.sets, this.state.sets.A > this.state.sets.B ? 'A' : 'B')) {
      this.state.matchOver = true;
      return;
    }
    // Prepare for next set
    this.state.games = { A: 0, B: 0 };
    this.state.points = { A: 0, B: 0 };
    this.state.inTieBreak = false;
  }

  public getScore(): string {
    return formatScore(this.state);
  }

  // Expose internal state for exhaustive testing (read‑only)
  public getState(): Readonly<GameScore> {
    return this.state;
  }
}
