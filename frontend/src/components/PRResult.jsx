export default function PRResult({ prUrl }) {
  if (!prUrl) return null;

  return (
    <div className="card">
      <h2>Pull Request Created</h2>

      <a href={prUrl} target="_blank" rel="noreferrer">
        Open GitHub Pull Request
      </a>
    </div>
  );
}