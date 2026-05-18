import { useEffect, useState } from 'react';
import axios from 'axios';

import SpecForm from './components/SpecForm';
import PipelineStatus from './components/PipelineStatus';
import PRResult from './components/PRResult';
import ErrorBanner from './components/ErrorBanner';
import JobHistory from './components/JobHistory';

import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function App() {
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submitSpec(spec) {
    try {
      setLoading(true);
      setJob(null);
      setError(null);

      const response = await axios.post(`${API_URL}/api/spec`, {
        spec
      });

      const newJobId = response.data.jobId;
      setJobId(newJobId);

      // Add to history
      if (window.addJobToHistory) {
        window.addJobToHistory({
          id: newJobId,
          specUrl: spec.specUrl || 'N/A',
          repoUrl: spec.repoUrl || 'N/A',
          status: 'pending'
        });
      }

    } catch (error) {
      console.error(error);
      setError(error.response?.data || error.message || 'Failed to submit specification');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/jobs/${jobId}`
        );

        setJob(response.data);

        // Update history with latest status
        if (window.addJobToHistory && response.data.status !== job?.status) {
          window.addJobToHistory({
            id: response.data.id,
            specUrl: response.data.specUrl || 'N/A',
            repoUrl: response.data.repoUrl || 'N/A',
            status: response.data.status
          });
        }

        if (
          response.data.status === 'done' ||
          response.data.status === 'failed'
        ) {
          setLoading(false);
          clearInterval(interval);
        }

      } catch (error) {
        console.error(error);
        setError(error.response?.data || error.message || 'Failed to fetch job status');
        setLoading(false);
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);

  }, [jobId]);

  return (
    <div className="container">
      <h1>Spec-to-Ship</h1>

      <p className="subtitle">
        AI engineering workflow powered by IBM Bob + watsonx Orchestrate
      </p>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <JobHistory onSelectJob={(id) => setJobId(id)} />

      <SpecForm
        onSubmit={submitSpec}
        loading={loading}
      />

      <PipelineStatus job={job} />

      <PRResult prUrl={job?.prUrl} />
    </div>
  );
}