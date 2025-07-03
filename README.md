# Artifact Runner

A React application for running Claude-generated artifacts with an intuitive interface.

![Artifact Runner Demo](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Artifact+Runner)

## Features

- 🎯 **Generic Artifact System**: Run any Claude-generated React component
- 📱 **Clean UI**: Modern sidebar navigation with artifact selection
- 🔧 **TypeScript Support**: Full type safety and IntelliSense
- ⚡ **Fast Development**: Vite-powered development server
- 🎨 **Tailwind CSS**: Beautiful, responsive styling
- 📦 **Easy Setup**: Simple project structure for adding new artifacts

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ArtifactRunner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
ArtifactRunner/
├── public/
│   └── index.html
├── src/
│   ├── artifacts/              # All Claude-generated artifacts go here
│   │   └── WheelStrategyAnalyzer.tsx
│   ├── components/            # Reusable components
│   │   └── Sidebar.tsx
│   ├── types/                 # TypeScript type definitions
│   │   └── artifact.ts
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## Adding New Artifacts

1. **Create the artifact component** in `src/artifacts/`:
   ```tsx
   // src/artifacts/MyNewArtifact.tsx
   import React from 'react';
   
   const MyNewArtifact = () => {
     return (
       <div className="p-6">
         <h1>My New Artifact</h1>
         {/* Your artifact content */}
       </div>
     );
   };
   
   export default MyNewArtifact;
   ```

2. **Register the artifact** in `src/App.tsx`:
   ```tsx
   // Add to the imports
   const artifacts: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
     'wheel-strategy-analyzer': React.lazy(() => import('./artifacts/WheelStrategyAnalyzer')),
     'my-new-artifact': React.lazy(() => import('./artifacts/MyNewArtifact')), // Add this line
   };
   
   // Add to the metadata
   const artifactMetadata: ArtifactMetadata[] = [
     // ... existing artifacts
     {
       id: 'my-new-artifact',
       name: 'My New Artifact',
       description: 'Description of what this artifact does',
       category: 'Utility',
       version: '1.0.0',
       tags: ['tag1', 'tag2']
     }
   ];
   ```

3. **Restart the development server** to see your new artifact in the sidebar.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Included Artifacts

### Wheel Strategy Analyzer
A comprehensive tool for analyzing options trading strategies, specifically the "Wheel" strategy. Features include:
- IB Flex Query XML import
- Put assignment tracking
- Break-even analysis
- Performance metrics
- Data export capabilities

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## Technologies Used

- **React 18** - User interface library
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **ESLint** - Code linting and formatting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 