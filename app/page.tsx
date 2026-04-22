'use client';

import { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import ModelDashboard from '../components/ModelDashboard';
import LayerTable from '../components/LayerTable';
import HardwareComparison from '../components/HardwareComparison';
import { useModelStore } from '../store/model-store';
import { exportMarkdown, exportJSON } from '../lib/export';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'layers' | 'hardware'>('layers');
  const { analysis, config, selectedHardware, isExporting, setIsExporting } = useModelStore();
  
  const handleExportMarkdown = () => {
    if (!analysis) return;
    
    setIsExporting(true);
    try {
      exportMarkdown(analysis, config, selectedHardware || undefined);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportJSON = () => {
    if (!analysis) return;
    
    setIsExporting(true);
    try {
      exportJSON(analysis, config, selectedHardware || undefined);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Layer Lens
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            PyTorch Model Parameter & Memory Analyzer
          </p>
        </div>
        
        {/* Export Controls */}
        {analysis && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              disabled={isExporting}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export MD'}
            </button>
            <button
              onClick={handleExportJSON}
              disabled={isExporting}
              className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors"
            >
              Export JSON
            </button>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Code Editor */}
        <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <CodeEditor />
        </div>
        
        {/* Right Panel - Analysis */}
        <div className="w-1/2 flex flex-col bg-white dark:bg-zinc-900">
          {/* Dashboard */}
          <div className="h-1/2 border-b border-zinc-200 dark:border-zinc-800">
            <ModelDashboard />
          </div>
          
          {/* Tabbed Content */}
          <div className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('layers')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'layers'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Layer Breakdown
              </button>
              <button
                onClick={() => setActiveTab('hardware')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'hardware'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Hardware Compatibility
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 min-h-0">
              {activeTab === 'layers' && <LayerTable />}
              {activeTab === 'hardware' && <HardwareComparison />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
