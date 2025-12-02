import React, { useState } from 'react';
import { Client, Fund, MatchResult } from '../types';
import { findMatches } from '../services/geminiService';
import { CheckCircle2, Loader2, Sparkles, Building, Briefcase } from 'lucide-react';

interface Props {
  clients: Client[];
  funds: Fund[];
}

const MatchesView: React.FC<Props> = ({ clients, funds }) => {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setMatches([]);
    
    const allMatches: MatchResult[] = [];
    
    // Analyze each fund sequentially to avoid hitting rate limits too hard if multiple funds
    for (const fund of funds) {
        if (fund.portfolio.length === 0) continue;
        const fundMatches = await findMatches(fund.name, clients, fund.portfolio);
        allMatches.push(...fundMatches);
    }
    
    setMatches(allMatches);
    setHasRun(true);
    setIsAnalyzing(false);
  };

  const fundsWithData = funds.filter(f => f.portfolio.length > 0).length;

  if (clients.length === 0 || fundsWithData === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
        <p className="text-lg font-medium">Ready to Match?</p>
        <p className="text-sm">Please add at least one Client and one Fund with portfolio data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {!hasRun && !isAnalyzing && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Portfolio Overlap Analysis</h2>
            <p className="text-slate-600 mb-8">
              The AI will cross-reference your <span className="font-semibold text-blue-600">{clients.length} Clients</span> against 
              the portfolios of <span className="font-semibold text-indigo-600">{fundsWithData} Funds</span>.
              It handles name variations (Hebrew/English) automatically.
            </p>
            <button
              onClick={runAnalysis}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-semibold text-lg"
            >
              <Sparkles className="w-5 h-5" />
              Analyze Overlaps
            </button>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-slate-800">Analyzing Connections...</h3>
          <p className="text-slate-500 mt-2">Comparing names, resolving entities, and checking Hebrew/English aliases.</p>
        </div>
      )}

      {hasRun && !isAnalyzing && (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Analysis Results</h2>
                <button onClick={runAnalysis} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    Re-run Analysis
                </button>
            </div>

          {matches.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No direct matches found between your client list and the selected funds.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {matches.map((match, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-l-green-500 border-y border-r border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <Briefcase className="w-3 h-3" />
                      Your Client
                    </div>
                    <div className="text-lg font-bold text-slate-900">{match.clientName}</div>
                  </div>

                  <div className="hidden md:flex flex-col items-center px-4">
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 whitespace-nowrap">
                        Matched ({match.confidence})
                    </span>
                    <div className="h-px w-16 bg-green-200 my-2"></div>
                  </div>

                  <div className="flex-1 space-y-1 md:text-right">
                    <div className="flex items-center gap-2 md:justify-end text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Building className="w-3 h-3" />
                        {match.fundName} Portfolio
                    </div>
                    <div className="text-lg font-bold text-indigo-700">{match.portfolioCompany}</div>
                  </div>
                  
                  <div className="w-full md:w-auto md:max-w-xs bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-100">
                    <span className="font-semibold text-slate-800">Reasoning:</span> {match.reasoning}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchesView;
