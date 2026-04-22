'use client';

import { useModelStore, HARDWARE_SPECS } from '../store/model-store';
import { useModelAnalyzer } from '../hooks/useModelAnalyzer';

interface HardwareComparisonProps {
  className?: string;
}

export default function HardwareComparison({ className = '' }: HardwareComparisonProps) {
  const { analysis, selectedHardware, setSelectedHardware } = useModelStore();
  const { formatMemory, checkHardwareCompatibility } = useModelAnalyzer();
  
  if (!analysis) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Hardware Compatibility
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Parse a model to see hardware compatibility
          </p>
        </div>
      </div>
    );
  }
  
  const requiredMemoryGB = analysis.memoryFootprint.total / (1024 ** 3);
  
  const getCompatibilityColor = (compatibility: 'compatible' | 'tight' | 'incompatible') => {
    switch (compatibility) {
      case 'compatible':
        return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'tight':
        return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'incompatible':
        return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
    }
  };
  
  const getCompatibilityLabel = (compatibility: 'compatible' | 'tight' | 'incompatible') => {
    switch (compatibility) {
      case 'compatible':
        return '✅ Compatible';
      case 'tight':
        return '⚠️ Tight Fit';
      case 'incompatible':
        return '❌ Insufficient';
    }
  };
  
  // Group hardware by category
  const hardwareByCategory = HARDWARE_SPECS.reduce((acc, hw) => {
    if (!acc[hw.category]) acc[hw.category] = [];
    acc[hw.category].push(hw);
    return acc;
  }, {} as Record<string, typeof HARDWARE_SPECS>);
  
  // Sort within each category by VRAM descending
  Object.keys(hardwareByCategory).forEach(category => {
    hardwareByCategory[category].sort((a, b) => b.vram - a.vram);
  });
  
  const categoryOrder = ['datacenter', 'professional', 'consumer'];
  const categoryLabels = {
    datacenter: 'Data Center',
    professional: 'Professional',
    consumer: 'Consumer'
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Hardware Compatibility
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Required: {formatMemory(analysis.memoryFootprint.total)}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {categoryOrder.map(category => {
          const hardware = hardwareByCategory[category];
          if (!hardware) return null;
          
          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>
              
              <div className="space-y-2">
                {hardware.map((hw) => {
                  const compatibility = checkHardwareCompatibility(hw.vram);
                  const utilizationPercent = Math.min((requiredMemoryGB / hw.vram) * 100, 100);
                  const isSelected = selectedHardware?.name === hw.name;
                  
                  return (
                    <div
                      key={hw.name}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-700'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                      onClick={() => setSelectedHardware(isSelected ? null : hw)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {hw.name}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            {hw.vram}GB VRAM • {hw.memoryBandwidth} GB/s
                          </div>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getCompatibilityColor(compatibility)}`}>
                          {getCompatibilityLabel(compatibility)}
                        </div>
                      </div>
                      
                      {/* Memory utilization bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                          <span>Memory Utilization</span>
                          <span>{utilizationPercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              compatibility === 'compatible'
                                ? 'bg-green-500'
                                : compatibility === 'tight'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="text-zinc-600 dark:text-zinc-400">Available VRAM</div>
                              <div className="font-mono text-zinc-900 dark:text-zinc-100">
                                {formatMemory(hw.vram * 1024 ** 3)}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-600 dark:text-zinc-400">Free After Load</div>
                              <div className="font-mono text-zinc-900 dark:text-zinc-100">
                                {formatMemory(Math.max(0, (hw.vram * 1024 ** 3) - analysis.memoryFootprint.total))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* Privacy Notice */}
        <div className="mt-8 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
            🔒 Privacy Notice
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            All processing happens locally in your browser. Your model code never leaves your machine.
          </div>
        </div>
      </div>
    </div>
  );
}