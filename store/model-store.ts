import { create } from 'zustand';
import { ModelAnalysis, ModelConfig, PrecisionConfig, HardwareSpec } from '../types/model';

interface ModelStore {
  // Code input state
  code: string;
  setCode: (code: string) => void;
  
  // Analysis results
  analysis: ModelAnalysis | null;
  setAnalysis: (analysis: ModelAnalysis | null) => void;
  
  // Configuration
  config: ModelConfig;
  setConfig: (config: Partial<ModelConfig>) => void;
  setPrecision: (precision: PrecisionConfig) => void;
  setMode: (mode: 'inference' | 'training') => void;
  setBatchSize: (batchSize: number) => void;
  
  // UI state
  selectedHardware: HardwareSpec | null;
  setSelectedHardware: (hardware: HardwareSpec | null) => void;
  
  // Input shape for activation calculation
  inputShape: number[];
  setInputShape: (shape: number[]) => void;
  
  // Export state
  isExporting: boolean;
  setIsExporting: (isExporting: boolean) => void;
}

// Precision configurations
export const PRECISION_CONFIGS: PrecisionConfig[] = [
  { type: 'float32', bytesPerParam: 4, label: 'FP32 (4 bytes)' },
  { type: 'float16', bytesPerParam: 2, label: 'FP16 (2 bytes)' },
  { type: 'bfloat16', bytesPerParam: 2, label: 'BF16 (2 bytes)' },
  { type: 'int8', bytesPerParam: 1, label: 'INT8 (1 byte)' }
];

// Common hardware specifications
export const HARDWARE_SPECS: HardwareSpec[] = [
  { name: 'RTX 4090', vram: 24, memoryBandwidth: 1008, category: 'consumer' },
  { name: 'RTX 4080', vram: 16, memoryBandwidth: 717, category: 'consumer' },
  { name: 'RTX 4070 Ti', vram: 12, memoryBandwidth: 504, category: 'consumer' },
  { name: 'A100 80GB', vram: 80, memoryBandwidth: 2039, category: 'datacenter' },
  { name: 'A100 40GB', vram: 40, memoryBandwidth: 1555, category: 'datacenter' },
  { name: 'H100 80GB', vram: 80, memoryBandwidth: 3350, category: 'datacenter' },
  { name: 'V100 32GB', vram: 32, memoryBandwidth: 900, category: 'professional' },
  { name: 'RTX A6000', vram: 48, memoryBandwidth: 768, category: 'professional' }
];

export const useModelStore = create<ModelStore>((set) => ({
  // Initial state
  code: '',
  analysis: null,
  config: {
    precision: PRECISION_CONFIGS[0], // FP32 by default
    mode: 'inference',
    batchSize: 1,
  },
  selectedHardware: null,
  inputShape: [1, 3, 224, 224], // Default image input
  isExporting: false,
  
  // Actions
  setCode: (code) => set({ code }),
  setAnalysis: (analysis) => set({ analysis }),
  
  setConfig: (config) => set((state) => ({ 
    config: { ...state.config, ...config } 
  })),
  
  setPrecision: (precision) => set((state) => ({ 
    config: { ...state.config, precision } 
  })),
  
  setMode: (mode) => set((state) => ({ 
    config: { ...state.config, mode } 
  })),
  
  setBatchSize: (batchSize) => set((state) => ({ 
    config: { ...state.config, batchSize } 
  })),
  
  setSelectedHardware: (selectedHardware) => set({ selectedHardware }),
  setInputShape: (inputShape) => set({ inputShape }),
  setIsExporting: (isExporting) => set({ isExporting })
}));