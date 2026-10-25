import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Scale, TrendingUp, ArrowRight, IndianRupee } from 'lucide-react';

export const ToolsAndCalculatorsSection: React.FC = () => {
  // Quick EMI Calculator State
  const [loanAmount, setLoanAmount] = useState<number>(5000000); // 50 Lakhs
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);

  // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  return (
    <section className="gd-section" aria-labelledby="tools-heading">
      <div className="gd-container">
        <div className="gd-section-header">
          <div className="gd-section-title">
            <h3 id="tools-heading">Smart Tools &amp; Property Calculators</h3>
            <p>Financial and comparative intelligence to make confident investment decisions.</p>
          </div>
          <Link to="/tools/emi-calculator" className="gd-section-link">
            <span>Explore All Calculators</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="gd-tools-grid">
          {/* Tool 1: Interactive Home Loan EMI Calculator Preview */}
          <div className="gd-tool-card">
            <div className="gd-tool-header">
              <div className="gd-tool-icon">
                <Calculator size={24} />
              </div>
              <div>
                <h4>Home Loan EMI Calculator</h4>
                <p>Plan monthly repayments and interest breakdown</p>
              </div>
            </div>

            {/* Quick interactive controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span>Loan Amount:</span>
                  <span style={{ color: 'var(--gd-terra-600)', fontFamily: 'JetBrains Mono, monospace' }}>
                    ₹ {(loanAmount / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="30000000"
                  step="500000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Tenure: {tenureYears} Yrs</div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Rate: {interestRate}%</div>
                  <input
                    type="range"
                    min="6.5"
                    max="12"
                    step="0.25"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Monthly EMI Result Box */}
              <div
                style={{
                  background: 'var(--gd-warm-bg)',
                  padding: '12px 16px',
                  borderRadius: 'var(--gd-radius-md)',
                  border: '1px solid var(--gd-warm-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Monthly EMI
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gd-text-charcoal)', fontFamily: 'JetBrains Mono, monospace' }}>
                    ₹ {emi.toLocaleString()}
                  </div>
                </div>
                <Link
                  to={`/tools/emi-calculator?amount=${loanAmount}&tenure=${tenureYears}&rate=${interestRate}`}
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: 'var(--gd-terra-500)',
                    textDecoration: 'none',
                  }}
                >
                  Full Schedule →
                </Link>
              </div>
            </div>
          </div>

          {/* Tool 2: Compare Properties */}
          <div className="gd-tool-card">
            <div className="gd-tool-header">
              <div className="gd-tool-icon">
                <Scale size={24} />
              </div>
              <div>
                <h4>Property Compare Matrix</h4>
                <p>Compare square footage, rate/sq.ft, amenities, and AI valuations</p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--gd-text-slate)', lineHeight: 1.5, margin: '8px 0 auto 0' }}>
              Select up to 4 shortlisted properties to evaluate key specifications, price differentials, conformal risk scores, and estimated rental yields side-by-side.
            </p>

            <Link
              to="/tools/compare"
              className="gd-btn-search"
              style={{
                width: '100%',
                background: 'var(--gd-warm-bg)',
                color: 'var(--gd-text-charcoal)',
                border: '1.5px solid var(--gd-warm-border)',
                boxShadow: 'none',
                marginTop: '16px',
              }}
            >
              <Scale size={16} />
              <span>Launch Property Comparison</span>
            </Link>
          </div>

          {/* Tool 3: Locality Price Trends */}
          <div className="gd-tool-card">
            <div className="gd-tool-header">
              <div className="gd-tool-icon">
                <TrendingUp size={24} />
              </div>
              <div>
                <h4>Locality Trends &amp; Macro Index</h4>
                <p>Track National Housing Bank (NHB) HPI and metro growth</p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--gd-text-slate)', lineHeight: 1.5, margin: '8px 0 auto 0' }}>
              Access 7-city macroeconomic indicators, live air quality metrics (AQI), quarterly capital growth rates, and GMM market regime classifications.
            </p>

            <Link
              to="/market-insights"
              className="gd-btn-search"
              style={{
                width: '100%',
                background: 'var(--gd-warm-bg)',
                color: 'var(--gd-text-charcoal)',
                border: '1.5px solid var(--gd-warm-border)',
                boxShadow: 'none',
                marginTop: '16px',
              }}
            >
              <TrendingUp size={16} />
              <span>View Market Insights</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
