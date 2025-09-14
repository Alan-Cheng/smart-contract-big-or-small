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

export interface NFTInfo {
  hasWon: boolean;
  hasMinted: boolean;
  balance: number;
  tokenURI: string;
}

export interface NFTMintResult {
  tokenId: number;
  transactionHash: string;
}
