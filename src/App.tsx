import React, { useState, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import { ArtifactMetadata } from './types/artifact';

// Import artifacts here
const artifacts: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'wheel-strategy-analyzer': React.lazy(() => import('./artifacts/WheelStrategyAnalyzer'))
};

const artifactMetadata: ArtifactMetadata[] = [
  {
    id: 'wheel-strategy-analyzer',
    name: 'Wheel Strategy Analyzer',
    description: 'Put-Assignment Tracking & Break-Even Analysis for Options Trading',
    category: 'Trading',
    version: '1.0.0',
    tags: ['options', 'trading', 'analysis']
  }
];

function App() {
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  const renderArtifact = () => {
    if (!selectedArtifact || !artifacts[selectedArtifact]) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Welcome to Artifact Runner</h2>
            <p className="text-gray-500">Select an artifact from the sidebar to get started</p>
          </div>
        </div>
      );
    }

    const ArtifactComponent = artifacts[selectedArtifact];
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <ArtifactComponent />
      </Suspense>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        artifacts={artifactMetadata}
        selectedArtifact={selectedArtifact}
        onSelectArtifact={setSelectedArtifact}
      />
      <main className="flex-1 overflow-auto">
        {renderArtifact()}
      </main>
    </div>
  );
}

export default App; 