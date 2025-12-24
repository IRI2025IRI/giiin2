// Error handler utility for graceful error handling
export class ErrorHandler {
  static handleMetaMaskError(error: any) {
    // Silently handle MetaMask connection errors
    if (error?.message?.includes('MetaMask') || 
        error?.message?.includes('ethereum') ||
        error?.code === -32002) {
      console.warn('MetaMask connection attempt detected but not required for this app');
      return;
    }
    
    // Log other errors for debugging
    console.error('Application error:', error);
  }

  static suppressMetaMaskWarnings() {
    // Override console methods to filter MetaMask warnings
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('MetaMask') || 
          message.includes('ethereum') ||
          message.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')) {
        return; // Suppress MetaMask-related errors
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('MetaMask') || 
          message.includes('ethereum') ||
          message.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')) {
        return; // Suppress MetaMask-related warnings
      }
      originalWarn.apply(console, args);
    };
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  ErrorHandler.handleMetaMaskError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handleMetaMaskError(event.reason);
});
