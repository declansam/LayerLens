import { useEffect, useMemo, useCallback, useState } from 'react';
import { useModelStore } from '../store/model-store';
import { analyzeModel } from '../lib/parser';
import { ModelAnalysis, ModelConfig } from '../types/model';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function calculateMemoryWithConfig(
  baseAnalysis: ModelAnalysis, 
  config: ModelConfig, 
  inputShape: number[]
): ModelAnalysis {
  const { precision, mode, batchSize } = config;
  const bytesPerParam = precision.bytesPerParam;
  
  // Adjust for batch size
  const adjustedInputShape = [batchSize, ...inputShape.slice(1)];
  
  // Recalculate weights memory with precision
  const weightsMemory = baseAnalysis.totalParams * bytesPerParam;
  
  // Activation memory scales with batch size
  const batchMultiplier = batchSize / (baseAnalysis.inputShape[0] || 1);
  const activationMemory = baseAnalysis.memoryFootprint.activations * batchMultiplier * (bytesPerParam / 4); // Assuming base is FP32
  
  let totalMemory = weightsMemory + activationMemory;
  
  // Training mode requires additional memory for gradients and optimizer states
  if (mode === 'training') {
    const gradientMemory = weightsMemory; // Same as weights
    const optimizerMemory = weightsMemory * 2; // Adam requires 2x for momentum and variance
    totalMemory += gradientMemory + optimizerMemory;
  }
  
  return {
    ...baseAnalysis,
    inputShape: adjustedInputShape,
    memoryFootprint: {
      weights: weightsMemory,
      activations: activationMemory,
      total: totalMemory
    }
  };
}

export function useModelAnalyzer() {
  const {
    code,
    analysis,
    setAnalysis,
    config,
    inputShape
  } = useModelStore();
  
  // Debounce the code input to avoid excessive parsing
  const debouncedCode = useDebounce(code, 500);
  
  // Parse and analyze the model
  const baseAnalysis = useMemo(() => {
    if (!debouncedCode.trim()) {
      return null;
    }
    
    try {
      return analyzeModel(debouncedCode, inputShape);
    } catch (error) {
      console.error('Error analyzing model:', error);
      return null;
    }
  }, [debouncedCode, inputShape]);
  
  // Apply configuration to base analysis
  const configuredAnalysis = useMemo(() => {
    if (!baseAnalysis) return null;
    
    return calculateMemoryWithConfig(baseAnalysis, config, inputShape);
  }, [baseAnalysis, config, inputShape]);
  
  // Update analysis in store when it changes
  useEffect(() => {
    setAnalysis(configuredAnalysis);
  }, [configuredAnalysis, setAnalysis]);
  
  // Memory formatting helpers
  const formatMemory = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }, []);
  
  const formatParameters = useCallback((params: number): string => {
    if (params === 0) return '0';
    
    const units = ['', 'K', 'M', 'B', 'T'];
    const k = 1000;
    const i = Math.floor(Math.log(Math.abs(params)) / Math.log(k));
    
    if (i === 0) return params.toString();
    
    return parseFloat((params / Math.pow(k, i)).toFixed(2)) + units[i];
  }, []);
  
  // Hardware compatibility check
  const checkHardwareCompatibility = useCallback((vramGB: number): 'compatible' | 'tight' | 'incompatible' => {
    if (!configuredAnalysis) return 'incompatible';
    
    const requiredGB = configuredAnalysis.memoryFootprint.total / (1024 ** 3);
    const utilizationRatio = requiredGB / vramGB;
    
    if (utilizationRatio <= 0.7) return 'compatible';
    if (utilizationRatio <= 0.9) return 'tight';
    return 'incompatible';
  }, [configuredAnalysis]);
  
  // Get parsing errors for debugging
  const getParsingErrors = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!debouncedCode.trim()) return errors;
    
    // Check for common issues
    if (!debouncedCode.includes('nn.')) {
      errors.push('No PyTorch layers detected. Make sure to use nn.Linear, nn.Conv2d, etc.');
    }
    
    if (!debouncedCode.includes('self.')) {
      errors.push('No layer assignments found. Use self.layer_name = nn.LayerType(...)');
    }
    
    // Check for unsupported patterns
    const unsupportedPatterns = [
      'nn.ModuleList',
      'nn.Sequential',
      'nn.ModuleDict'
    ];
    
    unsupportedPatterns.forEach(pattern => {
      if (debouncedCode.includes(pattern)) {
        errors.push(`${pattern} is not yet supported. Please define layers individually.`);
      }
    });
    
    return errors;
  }, [debouncedCode]);
  
  return {
    analysis: configuredAnalysis,
    isAnalyzing: debouncedCode !== code, // True when debouncing
    formatMemory,
    formatParameters,
    checkHardwareCompatibility,
    getParsingErrors,
    hasCode: Boolean(debouncedCode.trim())
  };
}