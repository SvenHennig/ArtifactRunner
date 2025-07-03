import React, { useState, Suspense, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ArtifactCreator from './components/ArtifactCreator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ArtifactMetadata } from './types/artifact';
import { initializeDebugMode, debugLog, DEBUG_CONFIG } from './config/debug';

// Import artifacts here
const artifacts: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  // Add your artifacts here using the artifact creator
  // 'artifact-id': React.lazy(() => import('./artifacts/ArtifactComponent'))
  'wheelstrategyanalyzer': React.lazy(() => import('./artifacts/WheelStrategyAnalyzer')),
  'wheelstrategyanalyzer': React.lazy(() => import('./artifacts/WheelStrategyAnalyzer')),
};

const artifactMetadata: ArtifactMetadata[] = [
  {
    id: 'wheelstrategyanalyzer',
    name: 'WheelStrategyAnalyzer',
    description: 'No description provided',
    category: '',
    version: '1.0.0',
    tags: []
  },
  {
    id: 'wheelstrategyanalyzer',
    name: 'WheelStrategyAnalyzer',
    description: 'No description provided',
    category: '',
    version: '1.0.0',
    tags: []
  },
];

function App() {
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  // Initialize debug mode
  useEffect(() => {
    initializeDebugMode();
    debugLog.info('ArtifactRunner App initialized');
    
    if (DEBUG_CONFIG.isDevelopment) {
      debugLog.debug('Available artifacts:', Object.keys(artifacts));
      debugLog.debug('Artifact metadata:', artifactMetadata);
    }
  }, []);

  const handleSelectArtifact = (artifactId: string) => {
    debugLog.info('Selecting artifact:', artifactId);
    setSelectedArtifact(artifactId);
    setShowCreator(false);
  };

  const handleShowCreator = () => {
    debugLog.info('Showing artifact creator');
    setShowCreator(true);
    setSelectedArtifact(null);
  };

  const handleBackFromCreator = () => {
    debugLog.info('Returning from artifact creator');
    setShowCreator(false);
    setSelectedArtifact(null);
  };

  const renderMainContent = () => {
    if (showCreator) {
      return <ArtifactCreator onBack={handleBackFromCreator} />;
    }

    if (!selectedArtifact || !artifacts[selectedArtifact]) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Welcome to Artifact Runner</h2>
            <p className="text-gray-500 mb-6">No artifacts loaded yet. Get started by adding your first artifact!</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">🚀 Try the new feature!</h3>
              <p className="text-sm text-blue-800 mb-3">
                Import artifacts directly from Claude.ai URLs like:<br/>
                <code className="bg-blue-100 px-1 rounded text-xs">
                  https://claude.ai/public/artifacts/your-id
                </code>
              </p>
              <button 
                onClick={handleShowCreator}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add New Artifact
              </button>
            </div>
            
            <p className="text-xs text-gray-400">
              Supports URL import, manual paste, and file creation methods
            </p>
          </div>
        </div>
      );
    }

    const ArtifactComponent = artifacts[selectedArtifact];
    
    if (DEBUG_CONFIG.isDevelopment) {
      debugLog.debug('Rendering artifact component:', selectedArtifact);
    }
    
    return (
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading artifact...</p>
              {DEBUG_CONFIG.isDevelopment && (
                <p className="text-xs text-gray-400 mt-1">Loading: {selectedArtifact}</p>
              )}
            </div>
          </div>
        }>
          <ArtifactComponent />
        </Suspense>
      </ErrorBoundary>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-100">
        <Sidebar
          artifacts={artifactMetadata}
          selectedArtifact={selectedArtifact}
          showCreator={showCreator}
          onSelectArtifact={handleSelectArtifact}
          onShowCreator={handleShowCreator}
        />
        <main className="flex-1 overflow-auto">
          {renderMainContent()}
        </main>
        
        {DEBUG_CONFIG.isDevelopment && (
          <div className="fixed bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            Debug Mode Active
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App; 