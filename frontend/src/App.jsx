import { useEffect, useState } from 'react';
import axios from 'axios';

import SpecForm from './components/SpecForm';
import PipelineStatus from './components/PipelineStatus';
import PRResult from './components/PRResult';

import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function App() {
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submitSpec(spec) {
    try {
      setLoading(true);
      setJob(null);

      const response = await axios.post(`${API_URL}/api/spec`, {
        spec
      });

      setJobId(response.data.jobId);

    } catch (error) {
      console.error(error);
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

        if (
          response.data.status === 'done' ||
          response.data.status === 'failed'
        ) {
          setLoading(false);
          clearInterval(interval);
        }

      } catch (error) {
        console.error(error);
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

      <SpecForm
        onSubmit={submitSpec}
        loading={loading}
      />

      <PipelineStatus job={job} />

      <PRResult prUrl={job?.prUrl} />
    </div>
  );
}