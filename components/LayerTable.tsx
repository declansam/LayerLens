'use client';

import { useModelStore } from '../store/model-store';
import { useModelAnalyzer } from '../hooks/useModelAnalyzer';

interface LayerTableProps {
  className?: string;
}

export default function LayerTable({ className = '' }: LayerTableProps) {
  const { analysis } = useModelStore();
  const { formatParameters } = useModelAnalyzer();
  
  if (!analysis || analysis.layers.length === 0) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Layer Breakdown
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No layers detected. Parse a model to see the breakdown.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Layer Breakdown
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {analysis.layers.length} layers • {formatParameters(analysis.totalParams)} total parameters
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Layer Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Shape
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Parameters
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {analysis.layers.map((layer, index) => {
                const percentage = analysis.totalParams > 0 
                  ? (layer.parameters / analysis.totalParams) * 100 
                  : 0;
                
                return (
                  <tr
                    key={`${layer.name}-${index}`}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {layer.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">
                        {layer.type.replace('nn.', '')}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                      {layer.shape.length > 0 ? (
                        <span className="text-xs">
                          [{layer.shape.join(', ')}]
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-right text-zinc-900 dark:text-zinc-100">
                      {formatParameters(layer.parameters)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-600 dark:text-zinc-400">
                      {percentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Summary Row */}
        <div className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Total ({analysis.layers.length} layers)
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {formatParameters(analysis.totalParams)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}