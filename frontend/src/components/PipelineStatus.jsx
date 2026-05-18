/**
 * Pipeline Status Component
 * Displays visual progress indicators for the pipeline stages
 */

import './PipelineStatus.css';

export default function PipelineStatus({ job }) {
  if (!job) return null;

  const stages = [
    { key: 'queued', label: 'Queued', icon: '⏳', description: 'Waiting to start' },
    { key: 'parsing', label: 'Parsing', icon: '📝', description: 'Analyzing specification' },
    { key: 'generating', label: 'Generating', icon: '⚙️', description: 'Creating code' },
    { key: 'assembling', label: 'Assembling', icon: '📦', description: 'Preparing PR' },
    { key: 'creating_pr', label: 'Creating PR', icon: '🚀', description: 'Opening pull request' },
    { key: 'done', label: 'Complete', icon: '✅', description: 'Successfully completed' }
  ];

  // Find current stage index
  const currentStageIndex = stages.findIndex(s => s.key === job.status);
  const isComplete = job.status === 'done';
  const isFailed = job.status === 'failed';

  // Calculate progress percentage
  const progressPercentage = isComplete ? 100 : 
    isFailed ? 0 : 
    currentStageIndex >= 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;

  return (
    <div className="card pipeline-card">
      <h2>Pipeline Status</h2>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div 
          className={`progress-bar ${isFailed ? 'failed' : ''}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Pipeline Stages */}
      <div className="pipeline-stages">
        {stages.map((stage, index) => {
          const isActive = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex && !isComplete && !isFailed;
          const isCompleted = index < currentStageIndex || isComplete;

          return (
            <div 
              key={stage.key}
              className={`stage ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
              title={stage.description}
            >
              <div className="stage-icon">{stage.icon}</div>
              <div className="stage-label">{stage.label}</div>
              {isCurrent && <div className="stage-spinner"></div>}
            </div>
          );
        })}
      </div>

      {/* Status Details */}
      <div className="status-details">
        <div className="status-row">
          <span className="status-label">Status:</span>
          <span className={`status-value status-${job.status}`}>
            {job.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {job.duration && (
          <div className="status-row">
            <span className="status-label">Duration:</span>
            <span className="status-value">{job.duration.toFixed(2)}s</span>
          </div>
        )}

        {job.currentStage && job.totalStages && (
          <div className="status-row">
            <span className="status-label">Progress:</span>
            <span className="status-value">
              Stage {job.currentStage} of {job.totalStages}
            </span>
          </div>
        )}
      </div>

      {/* Specification */}
      <div className="spec-preview">
        <strong>Specification:</strong>
        <p className="spec-text">{job.spec}</p>
      </div>

      {/* Generated Tasks */}
      {job.tasks?.length > 0 && (
        <div className="tasks-section">
          <h3>Generated Tasks ({job.tasks.length})</h3>
          <ul className="tasks-list">
            {job.tasks.map((task, index) => (
              <li key={task.id || index} className="task-item">
                <span className="task-type">{task.type}</span>
                <span className="task-description">{task.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Display */}
      {isFailed && job.error && (
        <div className="pipeline-error">
          <div className="error-header">
            <span className="error-icon">❌</span>
            <strong>Pipeline Failed</strong>
          </div>
          <p className="error-message">{job.error}</p>
          {job.errorDetails?.retryable && (
            <p className="error-hint">
              💡 This error may be temporary. Try submitting again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Made with Bob
