export interface GameResult {
  player: string;
  win: boolean;
  reward: string;
  number: number;
  betAmount: string;
}

export interface ContractInfo {
  balance: string;
  paused: boolean;
  owner: string;
}

export interface PlayerInfo {
  address: string;
  winnings: string;
  isOwner: boolean;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export interface BetInfo {
  amount: string;
  maxBet: string;
}
