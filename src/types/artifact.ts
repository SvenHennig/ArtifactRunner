import { ComponentType } from 'react';

export interface ArtifactMetadata {
  id: string;
  name: string;
  description: string;
  category?: string;
  version?: string;
  author?: string;
  createdAt?: string;
  tags?: string[];
}

export interface ArtifactModule {
  default: ComponentType<any>;
  metadata?: ArtifactMetadata;
}

export interface Trade {
  symbol: string | null;
  underlyingSymbol: string | null;
  assetCategory: string | null;
  buySell: string | null;
  quantity: number;
  price: number;
  proceeds: number;
  tradeDate: string | null;
  strike: string | null;
  expiry: string | null;
  putCall: string | null;
  commission: number;
}

export interface Assignment {
  symbol: string | null;
  assignmentDate: string | null;
  assignmentPrice: number;
  quantity: number;
  putPremiums: number;
  callPremiums: number;
  totalPremiums: number;
  effectiveBreakEven: number;
  currentlyHeld: boolean;
  exitDate: string | null;
  exitPrice: number | null;
  relatedPuts: Trade[];
  relatedCalls: Trade[];
  putAssignments: Trade[];
}

export interface CompletedCycle extends Assignment {
  capitalGainLoss: number;
  totalPnL: number;
  investedCapital: number;
  totalReturnPct: number;
  daysDuration: number;
  annualizedROI: number;
  performanceCategory: string;
  premiumContribution: number;
  capitalContribution: number;
  premiumYield: number;
  capitalYield: number;
  dailyReturn: number;
}

export interface PortfolioStats {
  totalCompletedCycles: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalInvested: number;
  avgReturnPerTrade: number;
  avgDuration: number;
  bestTrade: number;
  worstTrade: number;
}

export interface Analysis {
  trades: Trade[];
  assignments: Assignment[];
  completedCycles: CompletedCycle[];
  portfolioStats: PortfolioStats;
  currentHoldings: Assignment[];
  stats: {
    totalTrades: number;
    totalAssignments: number;
    currentPositions: number;
  };
} 