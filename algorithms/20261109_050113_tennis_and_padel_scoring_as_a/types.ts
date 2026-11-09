export type Player = 'A' | 'B';

export interface GamePoints {
  A: number; // 0,1,2,3,4 (4 = advantage)
  B: number;
}

export interface GameScore {
  points: GamePoints;
  games: { A: number; B: number };
  sets: { A: number; B: number };
  tieBreakPoints?: { A: number; B: number };
  inTieBreak: boolean;
  matchOver: boolean;
}
