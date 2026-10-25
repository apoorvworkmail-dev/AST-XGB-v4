import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Cpu, Activity, ExternalLink, Heart } from 'lucide-react';
import { checkBackendHealth } from '../../utils/api';

export const Footer: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then((status) => setBackendOnline(status.isHealthy));
    const interval = setInterval(() => {
      checkBackendHealth().then((status) => setBackendOnline(status.isHealthy));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="gd-footer" role="contentinfo">
      <div className="gd-container">
        <div className="gd-footer-grid">
          {/* Brand & Attribution */}
          <div className="gd-footer-col">
            <div className="gd-brand" style={{ marginBottom: '16px' }}>
              <div className="gd-brand-icon" style={{ width: '36px', height: '36px', fontSize: '18px' }}>
                <span>Gh</span>
              </div>
              <div className="gd-brand-text">
                <h1 style={{ color: '#ffffff', fontSize: '18px' }}>GharDhundo</h1>
                <span style={{ color: 'var(--gd-terra-400)' }}>AST-XGB REAL ESTATE</span>
              </div>
            </div>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              India&apos;s intelligent real estate discovery platform integrating the <strong>AST-XGB</strong> machine-learning valuation engine with conformal uncertainty bounds and macro regime detection.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="gd-status-pill">
                <span className={`gd-status-dot ${backendOnline ? 'online' : 'offline'}`} />
                <span style={{ color: '#cbd5e1' }}>
                  Backend Engine: {backendOnline === null ? 'Checking...' : backendOnline ? 'Operational (Port 8000)' : 'Offline / Standalone'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Real Estate Links */}
          <div className="gd-footer-col">
            <h5>Discover Properties</h5>
            <ul className="gd-footer-links">
              <li><Link to="/buy">Properties for Sale</Link></li>
              <li><Link to="/rent">Rental Apartments & Flats</Link></li>
              <li><Link to="/new-projects">New Projects & Launches</Link></li>
              <li><Link to="/collection/ready-to-move">Ready to Move Homes</Link></li>
              <li><Link to="/collection/premium-luxury">Luxury & Premium</Link></li>
              <li><Link to="/budget/50-lakhs-to-1-5-cr">Homes ₹50L - ₹1.5 Cr</Link></li>
              <li><Link to="/commercial">Commercial Office & Retail</Link></li>
              <li><Link to="/post-property">Post Free Property Listing</Link></li>
            </ul>
          </div>

          {/* 7 Metro Cities */}
          <div className="gd-footer-col">
            <h5>Metro Real Estate</h5>
            <ul className="gd-footer-links">
              <li><Link to="/city/Bengaluru">Bengaluru Real Estate</Link></li>
              <li><Link to="/city/Mumbai">Mumbai Properties</Link></li>
              <li><Link to="/city/Delhi">Delhi NCR Real Estate</Link></li>
              <li><Link to="/city/Hyderabad">Hyderabad Properties</Link></li>
              <li><Link to="/city/Pune">Pune Residential</Link></li>
              <li><Link to="/city/Chennai">Chennai Properties</Link></li>
              <li><Link to="/city/Kolkata">Kolkata Real Estate</Link></li>
              <li><Link to="/cities">All 7 Metros Directory →</Link></li>
            </ul>
          </div>

          {/* AST-XGB AI Suite & Tools */}
          <div className="gd-footer-col">
            <h5>AI Valuation & Tools</h5>
            <ul className="gd-footer-links">
              <li>
                <Link to="/ai-valuation" style={{ color: '#c7d2fe', fontWeight: 600 }}>
                  <Sparkles size={13} style={{ marginRight: '6px', verticalAlign: '-1px' }} />
                  AI Valuation Studio
                </Link>
              </li>
              <li><Link to="/ai-valuation/model-comparison">7-Model Multi-Ensemble</Link></li>
              <li><Link to="/ai-valuation/simulator">What-If Sensitivity Simulator</Link></li>
              <li><Link to="/market-insights">7-City Locality & Market Insights</Link></li>
              <li><Link to="/tools/emi-calculator">Home Loan EMI Calculator</Link></li>
              <li><Link to="/tools/compare">Compare Properties</Link></li>
              <li><Link to="/account/profile">Model Diagnostics & Specs</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Disclaimer */}
        <div className="gd-footer-bottom">
          <div>
            © {new Date().getFullYear()} GharDhundo • AST-XGB Real Estate Valuation Architecture. Developed by Apoorv Mishra.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#64748b' }}>
              Notice: Sample properties tagged as &ldquo;Verified Benchmark Demo&rdquo; for ML demonstration.
            </span>
            <Link to="/account/profile" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              System Health
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
