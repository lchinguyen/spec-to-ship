export default function PipelineStatus({ job }) {
  if (!job) return null;

  return (
    <div className="card">
      <h2>Pipeline Status</h2>

      <p>
        <strong>Status:</strong> {job.status}
      </p>

      <p>
        <strong>Spec:</strong> {job.spec}
      </p>

      {job.tasks?.length > 0 && (
        <>
          <h3>Generated Tasks</h3>

          <ul>
            {job.tasks.map((task) => (
              <li key={task.id}>
                <strong>{task.type}</strong> — {task.description}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}