export interface LayerInfo {
  name: string;
  type: string;
  shape: number[];
  parameters: number;
  inputShape?: number[];
  outputShape?: number[];
  details: Record<string, any>;
}

export interface ModelAnalysis {
  totalParams: number;
  memoryFootprint: {
    weights: number; // bytes
    activations: number; // bytes  
    total: number; // bytes
  };
  layers: LayerInfo[];
  inputShape: number[];
}

export interface HardwareSpec {
  name: string;
  vram: number; // GB
  memoryBandwidth: number; // GB/s
  category: 'consumer' | 'professional' | 'datacenter';
}

export interface PrecisionConfig {
  type: 'float32' | 'float16' | 'bfloat16' | 'int8';
  bytesPerParam: number;
  label: string;
}

export interface ModelConfig {
  precision: PrecisionConfig;
  mode: 'inference' | 'training';
  batchSize: number;
  sequenceLength?: number;
}

export interface ParsedLayer {
  originalLine: string;
  layerName: string;
  layerType: string;
  parameters: Record<string, string | number>;
  lineNumber: number;
}