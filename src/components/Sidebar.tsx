import React from 'react';
import { ArtifactMetadata } from '../types/artifact';
import { Code, Tag, Plus } from 'lucide-react';

interface SidebarProps {
  artifacts: ArtifactMetadata[];
  selectedArtifact: string | null;
  showCreator: boolean;
  onSelectArtifact: (artifactId: string) => void;
  onShowCreator: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ artifacts, selectedArtifact, showCreator, onSelectArtifact, onShowCreator }) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 flex items-center">
          <Code className="w-6 h-6 mr-2 text-blue-600" />
          Artifact Runner
        </h1>
        <p className="text-sm text-gray-600 mt-1">Run Claude-generated artifacts</p>
      </div>
      
      {/* Add New Artifact Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onShowCreator}
          className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed transition-colors ${
            showCreator
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add New Artifact</span>
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Paste Claude-generated React code
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {artifacts.map((artifact) => (
            <div
              key={artifact.id}
              onClick={() => onSelectArtifact(artifact.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedArtifact === artifact.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-1">{artifact.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{artifact.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  {artifact.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 mr-2">
                      <Tag className="w-3 h-3 mr-1" />
                      {artifact.category}
                    </span>
                  )}
                </div>
                {artifact.version && (
                  <span className="text-gray-400">v{artifact.version}</span>
                )}
              </div>
              
              {artifact.tags && artifact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {artifact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>{artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''} available</span>
          {showCreator && (
            <span className="text-blue-600 font-medium">Creator Mode</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 