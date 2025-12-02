import React, { useState, useRef } from 'react';
import { Client } from '../types';
import { Users, Trash2, Plus, FileText, Upload, FileMinus } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

const ClientManager: React.FC<Props> = ({ clients, setClients }) => {
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddClients = () => {
    if (!inputText.trim()) return;

    // Split by new lines or commas
    const names = inputText.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    const newClients: Client[] = names.map(name => ({
      id: crypto.randomUUID(),
      name,
      source: 'manual'
    }));

    setClients(prev => [...prev, ...newClients]);
    setInputText('');
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all clients?")) {
      setClients([]);
    }
  };

  const handleClearImported = () => {
    if (confirm("Are you sure you want to remove all imported clients?")) {
      setClients(prev => prev.filter(c => c.source !== 'file'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to array of arrays
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const newNames: string[] = [];
      
      rows.forEach((row) => {
        // Assume first column has the name
        if (row && row.length > 0) {
            const val = row[0];
            if (typeof val === 'string' && val.trim().length > 0) {
                newNames.push(val.trim());
            }
        }
      });
      
      // Filter out likely headers (simple heuristic)
      const filteredNames = newNames.filter(n => 
        !['name', 'client', 'company', 'שם לקוח', 'לקוח', 'שם החברה'].includes(n.toLowerCase())
      );

      const newClients = filteredNames.map(name => ({
        id: crypto.randomUUID(),
        name,
        source: 'file' as const
      }));

      setClients(prev => [...prev, ...newClients]);
      
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error("Error parsing Excel:", error);
      alert("Failed to parse Excel file. Please ensure it has a simple structure with client names in the first column.");
    }
  };

  const loadDemoData = () => {
    const demo = [
      "Wiz",
      "monday.com",
      "רפאל מערכות",
      "Gong.io",
      "Bringg",
      "Papaya Global",
      "בנק הפועלים",
      "Melio",
      "StarkWare",
      "Armis Security"
    ];
    const newClients = demo.map(name => ({ 
        id: crypto.randomUUID(), 
        name,
        source: 'demo' as const
    }));
    setClients(prev => [...prev, ...newClients]);
  };

  const hasImported = clients.some(c => c.source === 'file');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Manage Client List
          </h2>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {clients.length} Clients
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paste Client Names (One per line or comma separated)
            </label>
            <textarea
              className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
              placeholder="Example:&#10;Wiz&#10;בנק לאומי&#10;Check Point Software"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleAddClients}
              disabled={!inputText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Clients
            </button>

            {/* Excel Upload Button */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Import Excel
            </button>

            <button
              onClick={loadDemoData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              Load Demo
            </button>
            
            <div className="ml-auto flex gap-2">
                {hasImported && (
                    <button
                        onClick={handleClearImported}
                        className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <FileMinus className="w-4 h-4" />
                        Clear Imported
                    </button>
                )}

                {clients.length > 0 && (
                <button
                    onClick={handleClear}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                </button>
                )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
             For Excel import, names should be in the first column.
          </p>
        </div>
      </div>

      {clients.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Current List</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {clients.map(client => (
              <div key={client.id} className="relative group p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 truncate">
                {client.name}
                {client.source === 'file' && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Imported from file"></span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;