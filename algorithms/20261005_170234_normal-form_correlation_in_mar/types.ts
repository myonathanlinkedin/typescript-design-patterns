// Define domain models, interfaces, or memory structs

// Define a `Game` type representing a Markov game
type Game = {
  players: number[];
  states: number[][];
  actions: number[][];
  transitionMatrix: number[][];
  rewards: number[][];
};

// Define an `Action` type representing a player's action
type Action = number;

// Define a `Player` type representing a player in the game
type Player = {
  id: number;
  strategy: number[];
};

// Define a `GameState` type representing a game state
type GameState = {
  player1: Player;
  player2: Player;
};

// Define a `GameResult` type representing a game result
type GameResult = {
  winner: number;
  payoff: number;
};
