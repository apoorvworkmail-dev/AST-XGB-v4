import React, { useState } from 'react';
import { Cpu, Send, CheckCircle, AlertCircle, Play, Code } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('predict');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const samplePayloads: Record<string, any> = {
    predict: {
      city: 'Bengaluru',
      property_type: 'Apartment',
      builtup_area_sqft: 1450,
      bhk: 3,
      bathrooms: 2,
      project_age: 3,
      floor_no: 5,
      total_floors: 12,
      locality: 'Whitefield'
    },
    explain: {
      city: 'Bengaluru',
      property_type: 'Apartment',
      builtup_area_sqft: 1450,
      bhk: 3,
      bathrooms: 2,
      project_age: 3,
      floor_no: 5,
      total_floors: 12,
      locality: 'Whitefield'
    },
    counterfactual: {
      city: 'Bengaluru',
      property_type: 'Apartment',
      builtup_area_sqft: 1450,
      bhk: 3,
      bathrooms: 2,
      project_age: 3,
      floor_no: 5,
      total_floors: 12,
      locality: 'Whitefield',
      delta_area_percent: 20
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setApiResponse(null);

    const baseUrl = 'http://localhost:8000/api/v1';

    try {
      let url = `${baseUrl}/${activeEndpoint}`;
      let options: RequestInit = {};

      if (activeEndpoint === 'health' || activeEndpoint === 'market-state') {
        options = { method: 'GET' };
      } else {
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(samplePayloads[activeEndpoint] || samplePayloads.predict)
        };
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setApiResponse(JSON.stringify({ error: 'Backend unreachable. Verify server on http://localhost:8000', detail: e.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Cpu size={22} color="var(--primary-indigo)" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              FastAPI REST Endpoints & Live Interactive Playground
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Test production FastAPI valuation, TreeSHAP explainability, and counterfactual simulation endpoints live.
          </p>
        </div>
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="btn-primary-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Open Swagger UI (/docs)
        </a>
      </div>

      {/* Endpoint Selector Tabs */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'predict', method: 'POST', path: '/api/v1/predict', label: 'Valuation Point & Bounds' },
          { id: 'explain', method: 'POST', path: '/api/v1/explain', label: 'TreeSHAP Attributions' },
          { id: 'counterfactual', method: 'POST', path: '/api/v1/counterfactual', label: 'What-If Simulation' },
          { id: 'market-state', method: 'GET', path: '/api/v1/market-state', label: 'Market Indices' },
          { id: 'health', method: 'GET', path: '/api/v1/health', label: 'System Health' },
        ].map(ep => (
          <button
            key={ep.id}
            onClick={() => { setActiveEndpoint(ep.id); setApiResponse(null); }}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: activeEndpoint === ep.id ? '1px solid var(--primary-indigo)' : '1px solid var(--border-color)',
              background: activeEndpoint === ep.id ? 'var(--primary-indigo)' : 'var(--bg-card)',
              color: activeEndpoint === ep.id ? '#fff' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: ep.method === 'POST' ? '#10b981' : '#3b82f6', color: '#fff' }}>
              {ep.method}
            </span>
            {ep.label}
          </button>
        ))}
      </div>

      {/* Live Playground Workspace */}
      <div className="dashboard-sections-grid">
        {/* Request Details */}
        <div className="saas-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <Code size={18} color="var(--primary-indigo)" />
              <h3>Request Parameters</h3>
            </div>
            <button className="btn-primary-sm" onClick={handleExecute} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Play size={14} /> {loading ? 'Executing...' : 'Execute Request'}
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Endpoint:</span>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', margin: '6px 0 16px 0', color: 'var(--primary-indigo)' }}>
              http://localhost:8000/api/v1/{activeEndpoint}
            </div>

            {samplePayloads[activeEndpoint] && (
              <>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>JSON Request Body:</span>
                <pre style={{ background: '#1e1e2e', color: '#a6adc8', padding: '16px', borderRadius: '10px', fontSize: '13px', overflowX: 'auto', margin: '6px 0 0 0' }}>
                  {JSON.stringify(samplePayloads[activeEndpoint], null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>

        {/* Response JSON Output */}
        <div className="saas-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <Send size={18} color="var(--success-green)" />
              <h3>API Response Output</h3>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            {apiResponse ? (
              <pre style={{ background: '#1e1e2e', color: '#a6e3a1', padding: '16px', borderRadius: '10px', fontSize: '13px', overflowX: 'auto', margin: 0, maxHeight: '420px' }}>
                {apiResponse}
              </pre>
            ) : (
              <div style={{ background: 'var(--bg-subtle)', padding: '40px', textAlign: 'center', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Click <strong>Execute Request</strong> to run endpoint call live against backend server.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
