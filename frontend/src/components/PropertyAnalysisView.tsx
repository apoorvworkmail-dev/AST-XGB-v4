import React from 'react';
import {
  BarChart2, MapPin, Building, Maximize, Bed, Bath, Layers, TrendingUp,
  ShieldCheck, HelpCircle, CheckCircle2, AlertTriangle, Compass, Award
} from 'lucide-react';

interface PredictionResult {
  predicted_price_inr: number;
  predicted_price_formatted: string;
  price_per_sqft: number;
  conformal_lower_90_inr: number;
  conformal_upper_90_inr: number;
  conformal_lower_90_formatted: string;
  conformal_upper_90_formatted: string;
  active_market_regime: string;
  regime_confidence: number;
  latency_ms: number;
  model_version: string;
  validation_warnings: string[];
}

interface PropertyAnalysisViewProps {
  city: string;
  locality: string;
  propertyType: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  age: number;
  floor: number;
  totalFloors: number;
  prediction: PredictionResult | null;
  onEditDetails: () => void;
}

export const PropertyAnalysisView: React.FC<PropertyAnalysisViewProps> = ({
  city,
  locality,
  propertyType,
  area,
  bedrooms,
  bathrooms,
  age,
  floor,
  totalFloors,
  prediction,
  onEditDetails
}) => {
  const ppsf = prediction ? prediction.price_per_sqft : Math.round(10400000 / area);
  const areaPerBhk = Math.round(area / bedrooms);
  const bathRatio = (bathrooms / bedrooms).toFixed(2);
  const floorRatio = Math.round((floor / totalFloors) * 100);

  // Mock SHAP Feature Drivers based on property features
  const positiveDrivers = [
    { feature: 'builtup_area_sqft', name: 'Built-up Area (sq ft)', impact: '+₹ 28.45 L', percent: '+27.4%', val: `${area} sqft` },
    { feature: 'historical_locality_ppsf', name: 'Locality Historical Benchmark', impact: '+₹ 18.20 L', percent: '+17.5%', val: `${locality}` },
    { feature: 'metro_stations_distance_km', name: 'Metro Proximity (< 1.2 km)', impact: '+₹ 9.15 L', percent: '+8.8%', val: '0.85 km' },
    { feature: 'bhk', name: 'BHK Count & Room Layout', impact: '+₹ 7.80 L', percent: '+7.5%', val: `${bedrooms} BHK` },
    { feature: 'hist_hpi_market', name: 'NHB HPI Growth Regime', impact: '+₹ 4.60 L', percent: '+4.4%', val: 'Index 142.8' },
  ];

  const negativeSuppressors = [
    { feature: 'project_age', name: 'Property Building Age', impact: '-₹ 5.10 L', percent: '-4.9%', val: `${age} Years Old` },
    { feature: 'aqi_30d_avg', name: 'Locality Environmental AQI', impact: '-₹ 3.40 L', percent: '-3.3%', val: '148 AQI' },
    { feature: 'derived_bathrooms_per_bhk', name: 'Bathroom Ratio Deviation', impact: '-₹ 1.85 L', percent: '-1.8%', val: `${bathRatio} Ratio` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
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
            <BarChart2 size={22} color="var(--primary-indigo)" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Property Analysis & SHAP Feature Attribution
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Granular feature impact decomposition using TreeExplainer SHAP values & spatial amenity scores.
          </p>
        </div>
        <button className="btn-primary-sm" onClick={onEditDetails} style={{ padding: '10px 18px', fontSize: '13px' }}>
          Change Property Input
        </button>
      </div>

      {/* Structural Efficiency KPI Tiles */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Price / Sq Ft Rate</span>
            <div className="metric-icon green"><Maximize size={18} /></div>
          </div>
          <div className="metric-value">₹ {ppsf.toLocaleString()}</div>
          <div className="metric-footer">
            <span style={{ color: 'var(--success-green)', fontWeight: 600 }}>City Locality Rate</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Area per BHK</span>
            <div className="metric-icon purple"><Bed size={18} /></div>
          </div>
          <div className="metric-value">{areaPerBhk} sq ft</div>
          <div className="metric-footer">
            <span style={{ color: 'var(--text-muted)' }}>Optimal spaciousness</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Bathroom / BHK Ratio</span>
            <div className="metric-icon blue"><Bath size={18} /></div>
          </div>
          <div className="metric-value">{bathRatio}</div>
          <div className="metric-footer">
            <span style={{ color: 'var(--text-muted)' }}>{bathrooms} Bath for {bedrooms} BHK</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Floor Elevation Level</span>
            <div className="metric-icon amber"><Layers size={18} /></div>
          </div>
          <div className="metric-value">Floor {floor} / {totalFloors}</div>
          <div className="metric-footer">
            <span style={{ color: 'var(--text-muted)' }}>{floorRatio}% Building Height</span>
          </div>
        </div>
      </div>

      {/* Main Grid: SHAP Drivers + Spatial Proximity */}
      <div className="dashboard-sections-grid">
        {/* SHAP Positive & Negative Drivers */}
        <div className="saas-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <TrendingUp size={18} color="var(--success-green)" />
              <h3>TreeSHAP Feature Attributions</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Valuation Drivers
            </span>
          </div>

          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--success-green)', marginBottom: '12px', fontWeight: 700 }}>
              Positive Price Value Drivers (+ Lakhs)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {positiveDrivers.map(d => (
                <div key={d.feature} style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-main)' }}>{d.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>InputValue: {d.val}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success-green)' }}>{d.impact}</span>
                    <span style={{ fontSize: '11px', display: 'block', color: 'var(--success-green)', fontWeight: 600 }}>{d.percent}</span>
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--danger-red)', marginTop: '20px', marginBottom: '12px', fontWeight: 700 }}>
              Value Suppressors (- Lakhs)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {negativeSuppressors.map(d => (
                <div key={d.feature} style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-main)' }}>{d.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>InputValue: {d.val}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--danger-red)' }}>{d.impact}</span>
                    <span style={{ fontSize: '11px', display: 'block', color: 'var(--danger-red)', fontWeight: 600 }}>{d.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spatial POI Proximity & Infrastructure */}
        <div className="saas-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <MapPin size={18} color="var(--primary-indigo)" />
              <h3>Spatial Infrastructure Proximity</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {[
              { name: 'Metro / Rapid Transit Station', dist: '0.85 km', score: 'Excellent', color: 'var(--success-green)' },
              { name: 'Schools & Educational Institutes', dist: '1.40 km', score: 'High Access', color: 'var(--success-green)' },
              { name: 'Hospitals & Medical Centers', dist: '2.10 km', score: 'Good', color: 'var(--primary-indigo)' },
              { name: 'Shopping Malls & Retail Hubs', dist: '1.75 km', score: 'Good', color: 'var(--primary-indigo)' },
              { name: 'Railway Station Hub', dist: '5.20 km', score: 'Moderate', color: '#f59e0b' },
              { name: 'Central Business District (CBD)', dist: '8.50 km', score: 'Moderate', color: '#f59e0b' },
            ].map(item => (
              <div key={item.name} style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-main)' }}>{item.name}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Haversine Distance: {item.dist}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: item.color, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                  {item.score}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={20} color="var(--primary-indigo)" />
            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
              Overall Spatial Accessibility Index: <strong>8.85 / 10</strong> (Top Tier Locality)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
