export type Choice = 1 | 2 | 3;

export interface User {
  uid: string;
  name: string;
  is_ai: boolean;
  points: number;
}

export interface UserCreate {
  name: string;
}

export interface UserMini {
  name: string;
  is_ai: boolean;
  points: number;
}

export interface Prediction {
  user: UserMini;
  choice: Choice;
}

export interface GameRoundRaw {
  id: number;
  start_at: string;
  closed_at: string;
  target_at: string;
  base_price: number;
  result_price: number | null;
  winning_choice: Choice | null;
  predictions: Prediction[];
}

export interface GameRound {
  id: number;
  start_at: Date;
  closed_at: Date;
  target_at: Date;
  base_price: number;
  result_price: number | null;
  winning_choice: Choice | null;
  predictions: Prediction[];
}

export interface PredictionCreateResponse {
  id: number;
  game_round_id: number;
  choice: Choice;
  user: UserMini;
}

export interface UserStats {
  rank: number;
  username: string;
  points: number;
  total_rounds: number;
  wins: number;
  win_rate: number;
}

export interface LeaderBoard {
  rank: number;
  username: string;
  points: number;
  total_rounds: number;
  wins: number;
  win_rate: number;
}
