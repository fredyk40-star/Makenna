import { Component } from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      recoverable: true
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      recoverable: true
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error to console
    console.error('--- ERROR BOUNDARY CAUGHT AN ERROR ---');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('--------------------------------------');

    // Check if error is recoverable
    const isNetworkError = error.message.includes('network') || 
                           error.message.includes('offline') ||
                           error.message.includes('fetch');
    
    const isChunkLoadError = error.message.includes('chunk') ||
                             error.message.includes('loading chunk');
    
    if (isNetworkError || isChunkLoadError) {
      this.setState({ recoverable: true });
      
      // Attempt to recover from chunk load errors
      if (isChunkLoadError) {
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    } else {
      this.setState({ recoverable: false });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        >
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-soft p-8 text-center">
            <div className="text-6xl mb-4" role="img" aria-label="Smiling face">
              {this.state.recoverable ? '😊' : '🔧'}
            </div>
            <h1 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {this.state.recoverable ? 'Something went wrong' : 'Technical Issue'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {this.state.recoverable 
                ? "Don't worry, we'll get you back on track!"
                : 'Please try refreshing the page.'
              }
            </p>
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="text-left mb-4">
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleRetry}
              className="btn-primary"
              aria-label="Refresh page"
            >
              {this.state.recoverable ? 'Try Again' : 'Refresh Page'}
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;