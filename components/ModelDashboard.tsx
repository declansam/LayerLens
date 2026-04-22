'use client';

import { useModelStore, PRECISION_CONFIGS } from '../store/model-store';
import { useModelAnalyzer } from '../hooks/useModelAnalyzer';

interface ModelDashboardProps {
  className?: string;
}

export default function ModelDashboard({ className = '' }: ModelDashboardProps) {
  const {
    analysis,
    config,
    setPrecision,
    setMode,
    setBatchSize,
    inputShape,
    setInputShape
  } = useModelStore();
  
  const {
    formatMemory,
    formatParameters,
    getParsingErrors,
    hasCode,
    isAnalyzing
  } = useModelAnalyzer();
  
  const errors = getParsingErrors();
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Model Analysis
        </h2>
        
        {/* Configuration Controls */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Precision
              </label>
              <select
                value={config.precision.type}
                onChange={(e) => {
                  const precision = PRECISION_CONFIGS.find(p => p.type === e.target.value);
                  if (precision) setPrecision(precision);
                }}
                className="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                {PRECISION_CONFIGS.map((precision) => (
                  <option key={precision.type} value={precision.type}>
                    {precision.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Mode
              </label>
              <select
                value={config.mode}
                onChange={(e) => setMode(e.target.value as 'inference' | 'training')}
                className="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="inference">Inference</option>
                <option value="training">Training</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                value={config.batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Input Shape
              </label>
              <input
                type="text"
                value={inputShape.slice(1).join(', ')}
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => parseInt(v.trim()) || 0);
                  setInputShape([config.batchSize, ...values]);
                }}
                placeholder="3, 224, 224"
                className="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Analysis Results */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">Analyzing...</span>
          </div>
        )}
        
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Parsing Errors
            </h4>
            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {!hasCode && (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Paste your PyTorch model code to begin analysis
            </p>
          </div>
        )}
        
        {analysis && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Total Parameters
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {formatParameters(analysis.totalParams)}
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-md">
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Memory Footprint
                </div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {formatMemory(analysis.memoryFootprint.total)}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Weights: {formatMemory(analysis.memoryFootprint.weights)} • 
                  Activations: {formatMemory(analysis.memoryFootprint.activations)}
                </div>
              </div>
            </div>
            
            {/* Memory Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Memory Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Weights</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">
                    {formatMemory(analysis.memoryFootprint.weights)}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${(analysis.memoryFootprint.weights / analysis.memoryFootprint.total) * 100}%`
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Activations</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">
                    {formatMemory(analysis.memoryFootprint.activations)}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{
                      width: `${(analysis.memoryFootprint.activations / analysis.memoryFootprint.total) * 100}%`
                    }}
                  />
                </div>
                
                {config.mode === 'training' && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">Training Overhead</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">
                        {formatMemory(analysis.memoryFootprint.total - analysis.memoryFootprint.weights - analysis.memoryFootprint.activations)}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                      <div
                        className="bg-orange-600 h-1.5 rounded-full"
                        style={{
                          width: `${((analysis.memoryFootprint.total - analysis.memoryFootprint.weights - analysis.memoryFootprint.activations) / analysis.memoryFootprint.total) * 100}%`
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Configuration Info */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
              <div>Precision: {config.precision.label}</div>
              <div>Mode: {config.mode}</div>
              <div>Batch Size: {config.batchSize}</div>
              <div>Input Shape: [{analysis.inputShape.join(', ')}]</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}