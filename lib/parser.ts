import { ParsedLayer, LayerInfo, ModelAnalysis } from '../types/model';

interface LayerPattern {
  pattern: RegExp;
  paramCalculator: (params: Record<string, any>) => number;
  shapeCalculator?: (params: Record<string, any>, inputShape: number[]) => number[];
}

// Layer pattern definitions with parameter calculation formulas
const LAYER_PATTERNS: Record<string, LayerPattern> = {
  'nn.Linear': {
    pattern: /nn\.Linear\s*\(\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*(?:,\s*bias\s*=\s*(True|False))?\s*\)/i,
    paramCalculator: (params) => {
      const inFeatures = parseInt(params.in_features) || 0;
      const outFeatures = parseInt(params.out_features) || 0;
      const bias = params.bias !== 'False';
      return (inFeatures * outFeatures) + (bias ? outFeatures : 0);
    },
    shapeCalculator: (params, inputShape) => {
      const outFeatures = parseInt(params.out_features) || 0;
      return [...inputShape.slice(0, -1), outFeatures];
    }
  },
  
  'nn.Conv2d': {
    pattern: /nn\.Conv2d\s*\(\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*,\s*(?:kernel_size\s*=\s*)?(\d+|\(\s*\d+\s*,\s*\d+\s*\))\s*(?:,\s*stride\s*=\s*(\d+|\(\s*\d+\s*,\s*\d+\s*\)))?\s*(?:,\s*padding\s*=\s*(\d+|\(\s*\d+\s*,\s*\d+\s*\)))?\s*(?:,\s*bias\s*=\s*(True|False))?\s*\)/i,
    paramCalculator: (params) => {
      const inChannels = parseInt(params.in_channels) || 0;
      const outChannels = parseInt(params.out_channels) || 0;
      const kernelSize = parseKernelSize(params.kernel_size);
      const bias = params.bias !== 'False';
      
      const weightParams = inChannels * outChannels * kernelSize * kernelSize;
      const biasParams = bias ? outChannels : 0;
      return weightParams + biasParams;
    }
  },
  
  'nn.Conv1d': {
    pattern: /nn\.Conv1d\s*\(\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*,\s*(?:kernel_size\s*=\s*)?(\d+)\s*(?:,\s*stride\s*=\s*(\d+))?\s*(?:,\s*padding\s*=\s*(\d+))?\s*(?:,\s*bias\s*=\s*(True|False))?\s*\)/i,
    paramCalculator: (params) => {
      const inChannels = parseInt(params.in_channels) || 0;
      const outChannels = parseInt(params.out_channels) || 0;
      const kernelSize = parseInt(params.kernel_size) || 1;
      const bias = params.bias !== 'False';
      
      return (inChannels * outChannels * kernelSize) + (bias ? outChannels : 0);
    }
  },
  
  'nn.BatchNorm2d': {
    pattern: /nn\.BatchNorm2d\s*\(\s*(\w+|\d+)\s*\)/i,
    paramCalculator: (params) => {
      const numFeatures = parseInt(params.num_features) || 0;
      return numFeatures * 2; // weight and bias
    }
  },
  
  'nn.BatchNorm1d': {
    pattern: /nn\.BatchNorm1d\s*\(\s*(\w+|\d+)\s*\)/i,
    paramCalculator: (params) => {
      const numFeatures = parseInt(params.num_features) || 0;
      return numFeatures * 2;
    }
  },
  
  'nn.LayerNorm': {
    pattern: /nn\.LayerNorm\s*\(\s*(\w+|\d+|\(\s*\d+\s*,?\s*\)|\[\s*\d+\s*,?\s*\])\s*\)/i,
    paramCalculator: (params) => {
      const normalizedShape = parseInt(params.normalized_shape) || 0;
      return normalizedShape * 2; // weight and bias
    }
  },
  
  'nn.Embedding': {
    pattern: /nn\.Embedding\s*\(\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*\)/i,
    paramCalculator: (params) => {
      const numEmbeddings = parseInt(params.num_embeddings) || 0;
      const embeddingDim = parseInt(params.embedding_dim) || 0;
      return numEmbeddings * embeddingDim;
    }
  },
  
  'nn.MultiheadAttention': {
    pattern: /nn\.MultiheadAttention\s*\(\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*(?:,\s*dropout\s*=\s*[\d.]+)?\s*(?:,\s*bias\s*=\s*(True|False))?\s*\)/i,
    paramCalculator: (params) => {
      const embedDim = parseInt(params.embed_dim) || 0;
      const bias = params.bias !== 'False';
      
      // Q, K, V projections + output projection
      const projectionParams = 4 * (embedDim * embedDim);
      const biasParams = bias ? (4 * embedDim) : 0;
      return projectionParams + biasParams;
    }
  },
  
  'nn.LSTM': {
    pattern: /nn\.LSTM\s*\(\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*(?:,\s*num_layers\s*=\s*(\d+))?\s*(?:,\s*bias\s*=\s*(True|False))?\s*(?:,\s*batch_first\s*=\s*(True|False))?\s*(?:,\s*dropout\s*=\s*[\d.]+)?\s*(?:,\s*bidirectional\s*=\s*(True|False))?\s*\)/i,
    paramCalculator: (params) => {
      const inputSize = parseInt(params.input_size) || 0;
      const hiddenSize = parseInt(params.hidden_size) || 0;
      const numLayers = parseInt(params.num_layers) || 1;
      const bias = params.bias !== 'False';
      const bidirectional = params.bidirectional === 'True';
      
      const directions = bidirectional ? 2 : 1;
      
      // LSTM has 4 gates (input, forget, cell, output)
      let totalParams = 0;
      
      for (let layer = 0; layer < numLayers; layer++) {
        const inputDim = layer === 0 ? inputSize : hiddenSize * directions;
        
        // Weight matrices for each direction
        for (let dir = 0; dir < directions; dir++) {
          // Input-to-hidden weights (4 gates)
          totalParams += 4 * (inputDim * hiddenSize);
          // Hidden-to-hidden weights (4 gates)
          totalParams += 4 * (hiddenSize * hiddenSize);
          
          if (bias) {
            // Bias for each gate (4 gates)
            totalParams += 4 * hiddenSize;
          }
        }
      }
      
      return totalParams;
    }
  }
};

function parseKernelSize(kernelStr: string): number {
  if (!kernelStr) return 1;
  
  // Handle tuple format like (3, 3)
  const tupleMatch = kernelStr.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (tupleMatch) {
    return parseInt(tupleMatch[1]); // Assume square kernel for simplicity
  }
  
  return parseInt(kernelStr) || 1;
}

export function sanitizeCode(code: string): string {
  // Remove comments
  let sanitized = code.replace(/^\s*#.*$/gm, '');
  
  // Remove docstrings
  sanitized = sanitized.replace(/"""[\s\S]*?"""/g, '');
  sanitized = sanitized.replace(/'''[\s\S]*?'''/g, '');
  
  // Remove empty lines
  sanitized = sanitized.replace(/^\s*\n/gm, '');
  
  return sanitized.trim();
}

export function extractVariables(code: string): Record<string, string> {
  const variables: Record<string, string> = {};
  
  // Match self.variable = value patterns
  const variablePattern = /self\.(\w+)\s*=\s*([^#\n]+)/g;
  let match;
  
  while ((match = variablePattern.exec(code)) !== null) {
    const varName = match[1];
    const varValue = match[2].trim();
    
    // Try to evaluate simple expressions
    try {
      const numValue = eval(varValue.replace(/self\.(\w+)/g, (_, name) => variables[name] || '0'));
      variables[varName] = numValue.toString();
    } catch {
      variables[varName] = varValue;
    }
  }
  
  return variables;
}

export function substituteVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  
  // Replace self.variable_name with actual values
  for (const [varName, varValue] of Object.entries(variables)) {
    const regex = new RegExp(`self\\.${varName}\\b`, 'g');
    result = result.replace(regex, varValue);
  }
  
  return result;
}

export function parsePyTorchLayers(code: string): ParsedLayer[] {
  const sanitized = sanitizeCode(code);
  const variables = extractVariables(sanitized);
  const lines = sanitized.split('\n');
  const parsedLayers: ParsedLayer[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || !trimmedLine.includes('nn.')) return;
    
    // Extract layer assignment
    const assignmentMatch = trimmedLine.match(/self\.(\w+)\s*=\s*(.+)/);
    if (!assignmentMatch) return;
    
    const layerName = assignmentMatch[1];
    let layerDefinition = assignmentMatch[2];
    
    // Substitute variables
    layerDefinition = substituteVariables(layerDefinition, variables);
    
    // Try to match against known patterns
    for (const [layerType, { pattern }] of Object.entries(LAYER_PATTERNS)) {
      const match = layerDefinition.match(pattern);
      if (match) {
        const parameters: Record<string, any> = {};
        
        // Extract parameters based on layer type
        if (layerType === 'nn.Linear') {
          parameters.in_features = match[1];
          parameters.out_features = match[2];
          parameters.bias = match[3] || 'True';
        } else if (layerType === 'nn.Conv2d') {
          parameters.in_channels = match[1];
          parameters.out_channels = match[2];
          parameters.kernel_size = match[3];
          parameters.stride = match[4] || '1';
          parameters.padding = match[5] || '0';
          parameters.bias = match[6] || 'True';
        } else if (layerType === 'nn.Conv1d') {
          parameters.in_channels = match[1];
          parameters.out_channels = match[2];
          parameters.kernel_size = match[3];
          parameters.stride = match[4] || '1';
          parameters.padding = match[5] || '0';
          parameters.bias = match[6] || 'True';
        } else if (layerType.includes('BatchNorm') || layerType === 'nn.LayerNorm') {
          parameters.num_features = match[1];
          parameters.normalized_shape = match[1];
        } else if (layerType === 'nn.Embedding') {
          parameters.num_embeddings = match[1];
          parameters.embedding_dim = match[2];
        } else if (layerType === 'nn.MultiheadAttention') {
          parameters.embed_dim = match[1];
          parameters.num_heads = match[2];
          parameters.bias = match[3] || 'True';
        } else if (layerType === 'nn.LSTM') {
          parameters.input_size = match[1];
          parameters.hidden_size = match[2];
          parameters.num_layers = match[3] || '1';
          parameters.bias = match[4] || 'True';
          parameters.batch_first = match[5] || 'False';
          parameters.bidirectional = match[6] || 'False';
        }
        
        parsedLayers.push({
          originalLine: trimmedLine,
          layerName,
          layerType,
          parameters,
          lineNumber: index + 1
        });
        
        break;
      }
    }
  });
  
  return parsedLayers;
}

export function calculateLayerParameters(parsedLayers: ParsedLayer[]): LayerInfo[] {
  return parsedLayers.map(layer => {
    const pattern = LAYER_PATTERNS[layer.layerType];
    const parameters = pattern ? pattern.paramCalculator(layer.parameters) : 0;
    
    // Create parameter array for shape display
    const shape: number[] = [];
    if (layer.layerType === 'nn.Linear') {
      shape.push(parseInt(layer.parameters.in_features) || 0);
      shape.push(parseInt(layer.parameters.out_features) || 0);
    } else if (layer.layerType === 'nn.Conv2d') {
      const inChannels = parseInt(layer.parameters.in_channels) || 0;
      const outChannels = parseInt(layer.parameters.out_channels) || 0;
      const kernelSize = parseKernelSize(layer.parameters.kernel_size);
      shape.push(outChannels, inChannels, kernelSize, kernelSize);
    }
    
    return {
      name: layer.layerName,
      type: layer.layerType,
      shape,
      parameters,
      details: layer.parameters
    };
  });
}

export function analyzeModel(code: string, inputShape: number[] = [1, 3, 224, 224]): ModelAnalysis {
  const parsedLayers = parsePyTorchLayers(code);
  const layers = calculateLayerParameters(parsedLayers);
  
  const totalParams = layers.reduce((sum, layer) => sum + layer.parameters, 0);
  
  // Simple memory estimation (this is a basic approximation)
  const weightsMemory = totalParams * 4; // FP32 by default
  const activationMemory = estimateActivationMemory(layers, inputShape);
  
  return {
    totalParams,
    memoryFootprint: {
      weights: weightsMemory,
      activations: activationMemory,
      total: weightsMemory + activationMemory
    },
    layers,
    inputShape
  };
}

function estimateActivationMemory(layers: LayerInfo[], inputShape: number[]): number {
  // This is a simplified estimation - in reality, it depends on the specific architecture
  let currentShape = [...inputShape];
  let totalActivationMemory = 0;
  
  for (const layer of layers) {
    // Calculate approximate activation size based on layer type
    const batchSize = currentShape[0];
    let activationSize = 0;
    
    if (layer.type === 'nn.Linear') {
      const outFeatures = layer.shape[1] || 0;
      activationSize = batchSize * outFeatures * 4; // FP32
    } else if (layer.type === 'nn.Conv2d') {
      const outChannels = layer.shape[0] || 0;
      const height = currentShape[2] || 224;
      const width = currentShape[3] || 224;
      activationSize = batchSize * outChannels * height * width * 4; // FP32
    }
    
    totalActivationMemory += activationSize;
  }
  
  return totalActivationMemory;
}