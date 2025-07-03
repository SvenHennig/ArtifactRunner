import React, { useState } from 'react';
import { Download, Code, AlertCircle, CheckCircle, Copy, FileCode, Link, Loader } from 'lucide-react';

interface ArtifactCreatorProps {
  onBack: () => void;
}

const ArtifactCreator: React.FC<ArtifactCreatorProps> = ({ onBack }) => {
  const [code, setCode] = useState('');
  const [artifactUrl, setArtifactUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    category: '',
    version: '1.0.0',
    tags: ''
  });
  const [generatedId, setGeneratedId] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const generateComponentId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const extractComponentName = (code: string) => {
    const match = code.match(/const\s+(\w+)\s*=|function\s+(\w+)\s*\(/);
    return match ? (match[1] || match[2]) : '';
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    // Auto-extract component name if metadata name is empty
    if (!metadata.name) {
      const componentName = extractComponentName(newCode);
      if (componentName) {
        setMetadata(prev => ({ ...prev, name: componentName }));
        setGeneratedId(generateComponentId(componentName));
      }
    }
  };

  const handleMetadataChange = (field: string, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
    if (field === 'name') {
      setGeneratedId(generateComponentId(value));
    }
  };

  const extractArtifactId = (url: string) => {
    // Extract artifact ID from Claude.ai URLs
    const match = url.match(/artifacts\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const importFromClaudeAI = async () => {
    if (!artifactUrl.trim()) {
      setMessage('Please enter a Claude.ai artifact URL');
      setMessageType('error');
      return;
    }

    const artifactId = extractArtifactId(artifactUrl);
    if (!artifactId) {
      setMessage('Invalid Claude.ai artifact URL format');
      setMessageType('error');
      return;
    }

    setIsImporting(true);
    setMessage('');

    try {
      // Try to fetch the artifact content
      // Note: This might fail due to CORS, so we provide fallback instructions
      const apiUrl = `https://claude.ai/api/organizations/public/artifacts/${artifactId}`;
      
      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ArtifactRunner/1.0.0'
          }
        });
      } catch (corsError) {
        // CORS error - provide manual instructions
        setMessage(`⚠️ CORS blocked direct import. Please:
1. Open the artifact link: ${artifactUrl}
2. Copy the React component code
3. Paste it in the code editor below
4. Or use browser dev tools to fetch the content`);
        setMessageType('info');
        setIsImporting(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract code and metadata from Claude response
      if (data.content && data.content.code) {
        setCode(data.content.code);
        
        // Auto-extract component name
        const componentName = extractComponentName(data.content.code);
        
        setMetadata({
          name: data.title || componentName || 'Imported Artifact',
          description: data.description || 'Imported from Claude.ai',
          category: 'Imported',
          version: '1.0.0',
          tags: 'claude, imported'
        });
        
        setGeneratedId(generateComponentId(data.title || componentName || 'imported-artifact'));
        
        setMessage('✅ Artifact imported successfully from Claude.ai!');
        setMessageType('success');
      } else {
        throw new Error('Invalid artifact data structure');
      }
    } catch (error) {
      console.error('Import error:', error);
      setMessage(`❌ Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}. 
Try copying the code manually from the artifact page.`);
      setMessageType('error');
    } finally {
      setIsImporting(false);
    }
  };

  const clearImport = () => {
    setArtifactUrl('');
    setCode('');
    setMetadata({
      name: '',
      description: '',
      category: '',
      version: '1.0.0',
      tags: ''
    });
    setGeneratedId('');
    setMessage('');
  };

  const validateArtifact = () => {
    if (!code.trim()) return 'Please paste your React component code';
    if (!metadata.name.trim()) return 'Please enter a component name';
    if (!code.includes('export default')) return 'Code must include "export default"';
    return null;
  };

  const generateFiles = () => {
    const error = validateArtifact();
    if (error) {
      setMessage(error);
      setMessageType('error');
      return;
    }

    const componentId = generateComponentId(metadata.name);
    const fileName = `${metadata.name.replace(/[^a-zA-Z0-9]/g, '')}.tsx`;
    
    // Generate the artifact file
    const artifactContent = `${code}`;
    
    // Generate updated App.tsx imports
    const newImport = `'${componentId}': React.lazy(() => import('./artifacts/${fileName.replace('.tsx', '')}')),`;
    
    // Generate updated metadata
    const newMetadata = `{
    id: '${componentId}',
    name: '${metadata.name}',
    description: '${metadata.description}',
    category: '${metadata.category}',
    version: '${metadata.version}',
    tags: [${metadata.tags.split(',').map(tag => `'${tag.trim()}'`).join(', ')}]
  }`;

    return {
      fileName,
      artifactContent,
      newImport,
      newMetadata,
      componentId
    };
  };

  const downloadArtifact = () => {
    const files = generateFiles();
    if (!files) return;

    // Create and download the artifact file
    const blob = new Blob([files.artifactContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = files.fileName;
    a.click();
    URL.revokeObjectURL(url);

    setMessage(`✅ Artifact downloaded! Save it to src/artifacts/${files.fileName}`);
    setMessageType('success');
  };

  const saveToProject = async () => {
    const files = generateFiles();
    if (!files) return;

    try {
      setMessage('💾 Saving artifact to project...');
      setMessageType('info');

      const response = await fetch('/api/save-artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: files.fileName,
          artifactContent: files.artifactContent,
          componentId: files.componentId,
          metadata: metadata
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`🎉 ${result.message} Restart the dev server to see your new artifact!`);
        setMessageType('success');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error saving to project:', error);
      setMessage(`❌ Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const copyInstructions = () => {
    const files = generateFiles();
    if (!files) return;

    const instructions = `
# Add New Artifact: ${metadata.name}

## 1. Save the artifact file:
**File:** src/artifacts/${files.fileName}
**Content:** (Downloaded separately)

## 2. Update src/App.tsx:

### Add to the imports object:
${files.newImport}

### Add to the artifactMetadata array:
${files.newMetadata}

## 3. Restart the development server:
npm run dev

Your new artifact "${metadata.name}" will appear in the sidebar!
`;

    navigator.clipboard.writeText(instructions);
    setMessage('📋 Setup instructions copied to clipboard!');
    setMessageType('success');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Add New Artifact</h1>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearImport}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Code className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              onClick={copyInstructions}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Instructions</span>
            </button>
            <button
              onClick={saveToProject}
              className="flex items-center space-x-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <FileCode className="w-4 h-4" />
              <span>Save to Project</span>
            </button>
            <button
              onClick={downloadArtifact}
              className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* URL Import Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <Link className="w-4 h-4 mr-2" />
            Import from Claude.ai Artifact URL
          </h3>
          <div className="flex space-x-2">
            <input
              type="url"
              value={artifactUrl}
              onChange={(e) => setArtifactUrl(e.target.value)}
              placeholder="https://claude.ai/public/artifacts/your-artifact-id"
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isImporting}
            />
            <button
              onClick={importFromClaudeAI}
              disabled={isImporting || !artifactUrl.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isImporting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Link className="w-4 h-4" />
              )}
              <span>{isImporting ? 'Importing...' : 'Import'}</span>
            </button>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Paste a Claude.ai artifact URL to automatically import the code and metadata
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
          {/* Code Editor */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">React Component Code</h3>
              <p className="text-sm text-gray-600">Paste your Claude-generated React component here</p>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Paste your React component code here..."
                className="w-full h-full resize-none border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>

          {/* Metadata Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Artifact Metadata</h3>
              <p className="text-sm text-gray-600">Configure your artifact details</p>
            </div>
            <div className="flex-1 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Component Name *
                </label>
                <input
                  type="text"
                  value={metadata.name}
                  onChange={(e) => handleMetadataChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Todo List Manager"
                />
                {generatedId && (
                  <p className="text-xs text-gray-500 mt-1">ID: {generatedId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Brief description of what this artifact does (optional)..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={metadata.category}
                  onChange={(e) => handleMetadataChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Utility, Trading, Dashboard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={metadata.version}
                  onChange={(e) => handleMetadataChange('version', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1.0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={metadata.tags}
                  onChange={(e) => handleMetadataChange('tags', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., react, typescript, utility"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Bar */}
      {message && (
        <div className={`p-4 border-t ${
          messageType === 'error' ? 'bg-red-50 border-red-200' :
          messageType === 'success' ? 'bg-green-50 border-green-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {messageType === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {messageType === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {messageType === 'info' && <FileCode className="w-5 h-5 text-blue-600" />}
            <span className={`text-sm ${
              messageType === 'error' ? 'text-red-800' :
              messageType === 'success' ? 'text-green-800' :
              'text-blue-800'
            }`}>
              {message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactCreator; 