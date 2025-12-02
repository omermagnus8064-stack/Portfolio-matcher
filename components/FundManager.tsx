import React, { useState } from 'react';
import { Fund } from '../types';
import { fetchPortfolioForFund } from '../services/geminiService';
import { Building2, Search, Loader2, Globe, AlertCircle } from 'lucide-react';

interface Props {
  funds: Fund[];
  setFunds: React.Dispatch<React.SetStateAction<Fund[]>>;
}

const FundManager: React.FC<Props> = ({ funds, setFunds }) => {
  const [newFundName, setNewFundName] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleAddFund = async () => {
    if (!newFundName.trim()) return;

    const fundId = crypto.randomUUID();
    const newFund: Fund = {
      id: fundId,
      name: newFundName,
      status: 'searching',
      portfolio: []
    };

    setFunds(prev => [...prev, newFund]);
    setNewFundName('');
    setIsSearching(true);

    try {
      const portfolio = await fetchPortfolioForFund(newFund.name);
      
      setFunds(prev => prev.map(f => {
        if (f.id === fundId) {
          return {
            ...f,
            status: portfolio.length > 0 ? 'completed' : 'error',
            portfolio,
            lastUpdated: new Date()
          };
        }
        return f;
      }));
    } catch (error) {
      setFunds(prev => prev.map(f => {
        if (f.id === fundId) {
          return { ...f, status: 'error' };
        }
        return f;
      }));
    } finally {
      setIsSearching(false);
    }
  };

  const removeFund = (id: string) => {
    setFunds(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Target VC Funds
          </h2>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            className="flex-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            placeholder="Enter VC Fund Name (e.g. Pitango, Viola, Sequoia)"
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFund()}
          />
          <button
            onClick={handleAddFund}
            disabled={!newFundName.trim() || isSearching}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium min-w-[120px] justify-center"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Scan
          </button>
        </div>

        <div className="space-y-4">
          {funds.length === 0 && (
            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No funds tracked. Add a fund to start scanning their portfolio.</p>
            </div>
          )}

          {funds.map(fund => (
            <div key={fund.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
              <div className="p-4 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${fund.status === 'completed' ? 'bg-green-500' : fund.status === 'searching' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                  <h3 className="font-semibold text-slate-800">{fund.name}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">
                    {fund.status === 'searching' ? 'Scanning web...' : `${fund.portfolio.length} Companies found`}
                  </span>
                  <button onClick={() => removeFund(fund.id)} className="text-slate-400 hover:text-red-500 text-xs">
                    Remove
                  </button>
                </div>
              </div>
              
              {fund.status === 'completed' && fund.portfolio.length > 0 && (
                <div className="p-4 bg-white">
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                    {fund.portfolio.map((company, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                        {company.name}
                        {company.url && <Globe className="w-3 h-3 text-slate-400" />}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {fund.status === 'error' && (
                <div className="p-4 flex items-center gap-2 text-red-600 text-sm bg-red-50">
                  <AlertCircle className="w-4 h-4" />
                  Could not retrieve portfolio data. Try again or check the name.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FundManager;
