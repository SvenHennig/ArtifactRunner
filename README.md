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

### 📋 **Three Ways to Add Artifacts:**

### 🎨 **Method 1: Claude.ai URL Import (Easiest)**

1. **Open the app** at http://localhost:3001/
2. **Click "Add New Artifact"** in the sidebar
3. **Paste the Claude.ai artifact URL** (e.g., `https://claude.ai/public/artifacts/ad291580-952e-4ccf-b708-ef5898570e9c`)
4. **Click "Import"** - code and metadata will be auto-filled
5. **Click "Download"** and follow the setup instructions
6. **Restart the dev server** to see your new artifact

### 🎨 **Method 2: Paste & Save**

1. **Open the app** at http://localhost:3001/
2. **Click "Add New Artifact"** in the sidebar
3. **Paste your Claude-generated React code** into the editor
4. **Fill in the metadata** (name, description, category, etc.)
5. **Click "Download"** and follow the setup instructions
6. **Restart the dev server** to see your new artifact

### 🔧 **Method 3: Manual File Creation**

1. **Create the artifact component** in `src/artifacts/`:

   ```tsx
   // src/artifacts/MyNewArtifact.tsx
   import React from "react";

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
   const artifacts: Record<
     string,
     React.LazyExoticComponent<React.ComponentType<any>>
   > = {
     "wheel-strategy-analyzer": React.lazy(
       () => import("./artifacts/WheelStrategyAnalyzer")
     ),
     "my-new-artifact": React.lazy(() => import("./artifacts/MyNewArtifact")), // Add this line
   };

   // Add to the metadata
   const artifactMetadata: ArtifactMetadata[] = [
     // ... existing artifacts
     {
       id: "my-new-artifact",
       name: "My New Artifact",
       description: "Description of what this artifact does",
       category: "Utility",
       version: "1.0.0",
       tags: ["tag1", "tag2"],
     },
   ];
   ```

3. **Restart the development server** to see your new artifact in the sidebar.

### 📁 **Important File Locations:**

- ✅ **Artifacts go in**: `src/artifacts/` (NOT the root `Artifacts/` folder)
- ✅ **Registration**: Update `src/App.tsx` to register new artifacts
- ✅ **Auto-save**: Use the built-in paste & save feature for easiest setup

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Debug Mode

### Debug Scripts

Run the application in debug mode with enhanced logging and debugging features:

```bash
# Start with full debugging enabled
npm run dev:debug

# Start with performance logging
npm run dev:perf

# Build with debug information
npm run build:debug

# Preview with debug mode
npm run preview:debug

# Clean debug profiles
npm run clean:debug

# Show debug environment variables
npm run debug:info
```

### VS Code Debugging

The project includes comprehensive VS Code debugging configurations:

1. **Debug React App (Chrome)** - Launch and debug in Chrome
2. **Debug React App (Edge)** - Launch and debug in Edge
3. **Attach to React App** - Attach to running Chrome instance
4. **Debug Vite Dev Server** - Debug the Vite development server
5. **Debug Jest Tests** - Debug test suites

**To start debugging:**

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Debug React App (Chrome)"
4. Press F5 or click the green play button

### Debug Features

- **Enhanced Error Boundaries** - Detailed error information in development
- **Performance Logging** - Memory usage and React commit tracking
- **Verbose Logging** - Detailed console output for debugging
- **Source Maps** - Full source map support for debugging
- **Debug Indicator** - Visual indicator when debug mode is active
- **Browser DevTools** - Automatic opening of developer tools

### Debug Environment Variables

Set these environment variables to enable specific debugging features:

```bash
# Enable debug mode
VITE_DEBUG=true

# Set log level (debug, info, warn, error)
VITE_LOG_LEVEL=debug

# Enable verbose logging
VITE_VERBOSE_LOGGING=true

# Enable performance logging
VITE_PERFORMANCE_LOGGING=true

# Enable source maps
VITE_SOURCE_MAP=true
```

### Debug Utilities

In development mode, debugging utilities are available on the global `window` object:

```javascript
// Access debug configuration
console.log(window.ArtifactRunnerDebug.config);

// Use debug logging
window.ArtifactRunnerDebug.log.info("Debug message");

// Check version and build info
console.log(window.ArtifactRunnerDebug.version);
console.log(window.ArtifactRunnerDebug.buildTime);
```

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
