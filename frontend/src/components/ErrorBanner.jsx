/**
 * Error Banner Component
 * Displays error messages to users with dismiss functionality
 */

import './ErrorBanner.css';

export default function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  // Extract error message from different error formats
  const getErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return 'An unexpected error occurred';
  };

  // Extract error code if available
  const getErrorCode = () => {
    if (error.error?.code) return error.error.code;
    if (error.code) return error.code;
    return null;
  };

  const message = getErrorMessage();
  const code = getErrorCode();

  return (
    <div className="error-banner">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <strong>Error:</strong> {message}
          {code && <span className="error-code">({code})</span>}
        </div>
      </div>
      {onDismiss && (
        <button 
          className="error-dismiss" 
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Made with Bob
