import { useState } from 'react';

export default function SpecForm({ onSubmit, loading }) {
  const [spec, setSpec] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!spec.trim()) return;

    onSubmit(spec);
  };

  return (
    <div className="card">
      <h2>Engineering Specification</h2>

      <form onSubmit={handleSubmit}>
        <textarea
          rows={8}
          placeholder="Describe the feature you want to generate..."
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Running Pipeline...' : 'Generate PR'}
        </button>
      </form>
    </div>
  );
}