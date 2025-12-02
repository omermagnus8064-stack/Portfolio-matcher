export interface Client {
  id: string;
  name: string; // Can be Hebrew, English, Legal name, etc.
  source?: 'manual' | 'file' | 'demo';
}

export interface PortfolioCompany {
  name: string;
  description?: string;
  url?: string;
}

export interface Fund {
  id: string;
  name: string;
  status: 'idle' | 'searching' | 'completed' | 'error';
  portfolio: PortfolioCompany[];
  lastUpdated?: Date;
}

export interface MatchResult {
  clientName: string;
  portfolioCompany: string;
  fundName: string;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export enum AppView {
  CLIENTS = 'CLIENTS',
  FUNDS = 'FUNDS',
  MATCHES = 'MATCHES'
}