import React, { useState } from 'react';
import { Client, Fund, AppView } from './types';
import ClientManager from './components/ClientManager';
import FundManager from './components/FundManager';
import MatchesView from './components/MatchesView';
import { LayoutDashboard, Users, Building2, BarChart3, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CLIENTS);
  const [clients, setClients] = useState<Client[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  
  // Check for API Key presence safely
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
              <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-red-100 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h1 className="text-xl font-bold text-slate-900 mb-2">API Key Missing</h1>
                  <p className="text-slate-600">
                      The Google Gemini API Key is missing from the environment. 
                      Please ensure <code>process.env.API_KEY</code> is configured correctly to use the AI features.
                  </p>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.CLIENTS:
        return <ClientManager clients={clients} setClients={setClients} />;
      case AppView.FUNDS:
        return <FundManager funds={funds} setFunds={setFunds} />;
      case AppView.MATCHES:
        return <MatchesView clients={clients} funds={funds} />;
      default:
        return <ClientManager clients={clients} setClients={setClients} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800 bg-white">
          <div className="flex flex-col items-start">
             {/* Guberman Branding Replica */}
             <div className="text-2xl font-bold tracking-tighter text-slate-500">
                GUBE<span className="text-rose-700">R</span>MAN
             </div>
             <div className="text-[0.6rem] uppercase tracking-widest text-rose-700 font-medium -mt-1">
                Accounting & Finance Group
             </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-2">
            Finance Ops
          </div>
          <button
            onClick={() => setCurrentView(AppView.CLIENTS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              currentView === AppView.CLIENTS 
                ? 'bg-rose-700 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            My Clients
            <span className="ml-auto bg-slate-800 text-slate-300 py-0.5 px-2 rounded-full text-xs">
              {clients.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentView(AppView.FUNDS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              currentView === AppView.FUNDS 
                ? 'bg-rose-700 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            VC Funds
            <span className="ml-auto bg-slate-800 text-slate-300 py-0.5 px-2 rounded-full text-xs">
              {funds.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentView(AppView.MATCHES)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              currentView === AppView.MATCHES 
                ? 'bg-slate-700 text-white shadow-lg border border-slate-600' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analyze & Match
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-slate-800">
            <div className="text-xs text-slate-500">
                <p>System Status: <span className="text-green-400">Online</span></p>
                <p className="mt-1">Model: Gemini 2.5 Flash</p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-5 shadow-sm sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-slate-800">
            {currentView === AppView.CLIENTS && "Client Management"}
            {currentView === AppView.FUNDS && "Fund Intelligence"}
            {currentView === AppView.MATCHES && "Overlap Analysis"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
             {currentView === AppView.CLIENTS && "Input your current customer list for cross-referencing."}
             {currentView === AppView.FUNDS && "Track VC funds and automatically retrieve their portfolio companies."}
             {currentView === AppView.MATCHES && "Identify shared business relationships using AI matching."}
          </p>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;