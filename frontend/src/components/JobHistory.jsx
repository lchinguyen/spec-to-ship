import { useState, useEffect } from 'react';
import './JobHistory.css';

const JobHistory = ({ onSelectJob }) => {
  const [history, setHistory] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('jobHistory');
      if (stored) {
        const jobs = JSON.parse(stored);
        // Sort by timestamp, most recent first
        jobs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setHistory(jobs.slice(0, 10)); // Keep only last 10
      }
    } catch (error) {
      console.error('Failed to load job history:', error);
    }
  };

  const addToHistory = (job) => {
    try {
      const stored = localStorage.getItem('jobHistory');
      const jobs = stored ? JSON.parse(stored) : [];
      
      // Add new job
      jobs.unshift({
        id: job.id,
        specUrl: job.specUrl,
        repoUrl: job.repoUrl,
        status: job.status,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 10
      const trimmed = jobs.slice(0, 10);
      localStorage.setItem('jobHistory', JSON.stringify(trimmed));
      setHistory(trimmed);
    } catch (error) {
      console.error('Failed to save job history:', error);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all job history?')) {
      localStorage.removeItem('jobHistory');
      setHistory([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'processing':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Expose addToHistory method
  useEffect(() => {
    window.addJobToHistory = addToHistory;
    return () => {
      delete window.addJobToHistory;
    };
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="job-history">
      <div className="job-history-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="history-icon">📋</span>
          Recent Jobs ({history.length})
        </h3>
        <button className="toggle-btn">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="job-history-content">
          <div className="job-history-actions">
            <button onClick={clearHistory} className="clear-btn">
              Clear History
            </button>
          </div>

          <div className="job-history-list">
            {history.map((job) => (
              <div
                key={job.id}
                className="job-history-item"
                onClick={() => onSelectJob && onSelectJob(job.id)}
              >
                <div className="job-history-item-header">
                  <span
                    className="job-status-indicator"
                    style={{ backgroundColor: getStatusColor(job.status) }}
                  />
                  <span className="job-id">{job.id.substring(0, 8)}</span>
                  <span className="job-timestamp">{formatTimestamp(job.timestamp)}</span>
                </div>
                <div className="job-history-item-details">
                  <div className="job-detail">
                    <span className="job-detail-label">Spec:</span>
                    <span className="job-detail-value" title={job.specUrl}>
                      {job.specUrl.length > 40 
                        ? `${job.specUrl.substring(0, 40)}...` 
                        : job.specUrl}
                    </span>
                  </div>
                  <div className="job-detail">
                    <span className="job-detail-label">Repo:</span>
                    <span className="job-detail-value" title={job.repoUrl}>
                      {job.repoUrl.split('/').slice(-2).join('/')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobHistory;

// Made with Bob
