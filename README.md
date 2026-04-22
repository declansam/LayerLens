# Layer Lens

A lightweight PyTorch model analyzer that calculates parameter counts, memory usage, and hardware compatibility - all in your browser.

## Features

🔍 **Model Analysis**
- Parse PyTorch model code and extract layer definitions
- Calculate total parameters with mathematical precision
- Support for CNN, RNN, Transformer, and common layer types

💾 **Memory Estimation**
- Accurate VRAM usage calculation for different precisions (FP32, FP16, BF16, INT8)
- Training vs inference mode memory requirements
- Activation memory estimation based on input shapes

🖥️ **Hardware Compatibility**
- Real-time compatibility check against popular GPUs
- Consumer, professional, and data center hardware support
- Visual memory utilization indicators

📊 **Interactive Dashboard**
- Live code parsing with Monaco Editor (VS Code experience)
- Layer-by-layer parameter breakdown
- Memory footprint visualization

📄 **Export Reports**
- Generate detailed Markdown reports
- Export raw JSON data for further analysis
- 100% local processing for privacy

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Paste your PyTorch model code and see instant analysis!

## Example Usage

Paste any PyTorch model definition:

```python
class MyModel(nn.Module):
    def __init__(self):
        super(MyModel, self).__init__()
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3)
        self.bn1 = nn.BatchNorm2d(64)
        self.fc = nn.Linear(64, 10)
```

The app will automatically:
- Calculate total parameters (e.g., 3,146 parameters)
- Estimate memory usage (e.g., 12.6 MB for FP32 inference)
- Show hardware compatibility across different GPUs
- Provide layer-by-layer breakdown

## Supported Layer Types

- `nn.Linear` - Fully connected layers
- `nn.Conv1d`, `nn.Conv2d` - Convolutional layers
- `nn.BatchNorm1d`, `nn.BatchNorm2d` - Batch normalization
- `nn.LayerNorm` - Layer normalization
- `nn.Embedding` - Embedding layers
- `nn.MultiheadAttention` - Multi-head attention
- `nn.LSTM` - LSTM recurrent layers

## Privacy & Security

🔒 **All processing happens locally in your browser**
- No model code is sent to any server
- No data collection or tracking
- Works completely offline after loading

## Build and verify

```bash
npm run lint
npm run build
```

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Monaco Editor** for VS Code-like experience
- **Zustand** for state management
- **Tailwind CSS** for styling
