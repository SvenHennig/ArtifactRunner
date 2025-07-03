import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { promises as fs } from 'fs'
import path from 'path'

// Custom plugin to handle artifact saving
const artifactSaverPlugin = () => {
  return {
    name: 'artifact-saver',
    configureServer(server: any) {
      server.middlewares.use('/api/save-artifact', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', (chunk: any) => {
          body += chunk.toString()
        })

        req.on('end', async () => {
          try {
            const { fileName, artifactContent, componentId, metadata } = JSON.parse(body)
            
            // Save artifact file
            const artifactPath = path.join(process.cwd(), 'src', 'artifacts', fileName)
            await fs.writeFile(artifactPath, artifactContent, 'utf8')
            
            // Update App.tsx
            const appPath = path.join(process.cwd(), 'src', 'App.tsx')
            let appContent = await fs.readFile(appPath, 'utf8')
            
            // Add import to artifacts object
            const importName = fileName.replace('.tsx', '')
            const newImport = `  '${componentId}': React.lazy(() => import('./artifacts/${importName}')),`
            
            // Find the artifacts object and add the import
            const artifactsRegex = /(const artifacts[^{]*{\s*)([\s\S]*?)(\s*};)/
            const artifactsMatch = appContent.match(artifactsRegex)
            
            if (artifactsMatch) {
              const [, before, existing, after] = artifactsMatch
              const hasExisting = existing.trim().length > 0
              const newArtifactsContent = hasExisting 
                ? `${before}${existing.trimEnd()}\n${newImport}${after}`
                : `${before}\n${newImport}${after}`
              appContent = appContent.replace(artifactsRegex, newArtifactsContent)
            }
            
            // Add metadata to artifactMetadata array
            const description = metadata.description.trim() || 'No description provided'
            const tags = metadata.tags.trim() 
              ? metadata.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0).map((tag: string) => `'${tag}'`).join(', ')
              : ''
              
            const newMetadata = `  {
    id: '${componentId}',
    name: '${metadata.name}',
    description: '${description}',
    category: '${metadata.category}',
    version: '${metadata.version}',
    tags: [${tags}]
  },`
            
            const metadataRegex = /(const artifactMetadata[^[]*\[\s*)([\s\S]*?)(\s*\];)/
            const metadataMatch = appContent.match(metadataRegex)
            
            if (metadataMatch) {
              const [, before, existing, after] = metadataMatch
              const hasExisting = existing.trim().length > 0 && !existing.trim().includes('//')
              const newMetadataContent = hasExisting 
                ? `${before}${existing.trimEnd()}\n${newMetadata}${after}`
                : `${before}\n${newMetadata}${after}`
              appContent = appContent.replace(metadataRegex, newMetadataContent)
            }
            
            await fs.writeFile(appPath, appContent, 'utf8')
            
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Artifact saved successfully!',
              fileName,
              componentId 
            }))
            
          } catch (error) {
            console.error('Error saving artifact:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              success: false, 
              message: 'Failed to save artifact: ' + (error as Error).message 
            }))
          }
        })
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), artifactSaverPlugin()],
  server: {
    port: 3001,
    open: true,
    host: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemap: true
      }
    }
  },
  css: {
    devSourcemap: true
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __VITE_DEBUG__: JSON.stringify(process.env.VITE_DEBUG === 'true')
  },
  esbuild: {
    sourcemap: true,
    keepNames: true
  },
  optimizeDeps: {
    force: process.env.NODE_ENV === 'development'
  }
}) 