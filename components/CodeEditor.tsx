'use client';

import dynamic from 'next/dynamic';
import { useModelStore } from '../store/model-store';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react').then(mod => ({ default: mod.Editor })), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
});

const SAMPLE_CODE = `class MyModel(nn.Module):
    def __init__(self):
        super(MyModel, self).__init__()
        
        # CNN Feature Extractor
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3)
        self.bn1 = nn.BatchNorm2d(64)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(128)
        self.conv3 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(256)
        
        # Global Average Pooling
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        
        # Classifier
        self.fc1 = nn.Linear(256, 512)
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(512, 10)
        
    def forward(self, x):
        # Feature extraction
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.max_pool2d(x, 2)
        
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.max_pool2d(x, 2)
        
        x = F.relu(self.bn3(self.conv3(x)))
        x = self.avgpool(x)
        
        # Classifier
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x`;

interface CodeEditorProps {
  className?: string;
}

export default function CodeEditor({ className = '' }: CodeEditorProps) {
  const { code, setCode } = useModelStore();
  
  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
  };
  
  const handleEditorDidMount = (editor: any) => {
    // Set sample code if empty
    if (!code.trim()) {
      setCode(SAMPLE_CODE);
    }
    
    // Configure editor
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true
    });
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          PyTorch Model Code
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode(SAMPLE_CODE)}
            className="px-3 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Load Sample
          </button>
          <button
            onClick={() => setCode('')}
            className="px-3 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            padding: { top: 16, bottom: 16 },
            fontSize: 14,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: 'selection',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true
          }}
        />
      </div>
    </div>
  );
}