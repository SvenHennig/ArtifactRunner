// Debug configuration and utilities
export const DEBUG_CONFIG = {
  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isDebugMode: import.meta.env.VITE_DEBUG === 'true',
  
  // Logging levels
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  verboseLogging: import.meta.env.VITE_VERBOSE_LOGGING === 'true',
  
  // Debugging features
  enableSourceMaps: import.meta.env.VITE_SOURCE_MAP === 'true',
  enableArtifactDebugging: import.meta.env.VITE_DEBUG_ARTIFACT_CREATION === 'true',
  enablePerformanceLogging: import.meta.env.VITE_PERFORMANCE_LOGGING === 'true',
  
  // Development server
  devServerPort: import.meta.env.VITE_DEV_PORT || 3001,
  devServerHost: import.meta.env.VITE_DEV_HOST || 'localhost',
};

// Console logging utilities
export const debugLog = {
  info: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.isDevelopment) {
      console.log(`[ArtifactRunner] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.isDevelopment) {
      console.warn(`[ArtifactRunner] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.isDevelopment) {
      console.error(`[ArtifactRunner] ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.isDevelopment && DEBUG_CONFIG.isDebugMode) {
      console.debug(`[ArtifactRunner:DEBUG] ${message}`, ...args);
    }
  },
  
  verbose: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.isDevelopment && DEBUG_CONFIG.verboseLogging) {
      console.log(`[ArtifactRunner:VERBOSE] ${message}`, ...args);
    }
  },
  
  performance: (label: string, fn: () => void) => {
    if (DEBUG_CONFIG.isDevelopment && DEBUG_CONFIG.enablePerformanceLogging) {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(`[ArtifactRunner:PERF] ${label}: ${end - start}ms`);
    } else {
      fn();
    }
  },
  
  group: (label: string, fn: () => void) => {
    if (DEBUG_CONFIG.isDevelopment) {
      console.group(`[ArtifactRunner] ${label}`);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }
};

// Development utilities
export const devUtils = {
  // Expose debugging information on window object
  exposeDebugInfo: () => {
    if (DEBUG_CONFIG.isDevelopment) {
      (window as any).ArtifactRunnerDebug = {
        config: DEBUG_CONFIG,
        log: debugLog,
        version: import.meta.env.VITE_APP_VERSION || 'dev',
        buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
      };
      debugLog.info('Debug information exposed on window.ArtifactRunnerDebug');
    }
  },
  
  // React DevTools integration
  enableReactDevTools: () => {
    if (DEBUG_CONFIG.isDevelopment && typeof window !== 'undefined') {
      // Enable React DevTools profiler
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook) {
        hook.onCommitFiberRoot = (
          id: number,
          root: any,
          priorityLevel: any
        ) => {
          if (DEBUG_CONFIG.enablePerformanceLogging) {
            debugLog.performance(`React Commit (${id})`, () => {});
          }
        };
      }
    }
  },
  
  // Memory usage tracking
  trackMemoryUsage: () => {
    if (DEBUG_CONFIG.isDevelopment && 'memory' in performance) {
      const memory = (performance as any).memory;
      debugLog.debug('Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
      });
    }
  }
};

// Error boundary integration
export const debugErrorHandler = (error: Error, errorInfo: any) => {
  if (DEBUG_CONFIG.isDevelopment) {
    debugLog.error('React Error Boundary caught an error:', error);
    debugLog.group('Error Info', () => {
      debugLog.error('Component Stack:', errorInfo.componentStack);
      debugLog.error('Error Stack:', error.stack);
    });
  }
};

// Initialize debug utilities
export const initializeDebugMode = () => {
  if (DEBUG_CONFIG.isDevelopment) {
    debugLog.info('ArtifactRunner Debug Mode Initialized', DEBUG_CONFIG);
    devUtils.exposeDebugInfo();
    devUtils.enableReactDevTools();
    
    // Memory tracking interval
    if (DEBUG_CONFIG.enablePerformanceLogging) {
      setInterval(() => {
        devUtils.trackMemoryUsage();
      }, 30000); // Every 30 seconds
    }
  }
}; 