import React, { useState } from 'react';
import { Layout, Maximize, Eye, Info } from 'lucide-react';
import { PropertySpecs } from '../../types/property';

interface FloorPlanViewerProps {
  specs: PropertySpecs;
  propertyType: string;
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({ specs, propertyType }) => {
  const [activeTab, setActiveTab] = useState<'2d' | 'specs'>('2d');

  const builtup = specs.builtupAreaSqft;
  const carpet = specs.carpetAreaSqft || Math.round(builtup * 0.82);
  const efficiencyPct = Math.round((carpet / builtup) * 100);

  // Approximate proportional room dimensions based on BHK
  const bhk = specs.bhk || 2;
  const livingSqft = Math.round(builtup * 0.32);
  const masterBedSqft = Math.round(builtup * 0.24);
  const secondBedSqft = bhk >= 2 ? Math.round(builtup * 0.18) : 0;
  const thirdBedSqft = bhk >= 3 ? Math.round(builtup * 0.14) : 0;
  const kitchenSqft = Math.round(builtup * 0.12);
  const balconySqft = Math.round(builtup * 0.08);

  return (
    <div
      style={{
        backgroundColor: 'var(--gd-warm-card)',
        border: '1px solid var(--gd-warm-border)',
        borderRadius: 'var(--gd-radius-lg)',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: 'var(--gd-shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={19} color="var(--gd-terra-500)" />
            Floor Plan &amp; Spatial Layout
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
            Architectural schematic representation for {bhk} BHK {propertyType}
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--gd-warm-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('2d')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === '2d' ? 'var(--gd-warm-card)' : 'transparent',
              color: activeTab === '2d' ? 'var(--gd-terra-600)' : 'var(--gd-text-muted)',
              boxShadow: activeTab === '2d' ? 'var(--gd-shadow-sm)' : 'none',
            }}
          >
            2D Layout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'specs' ? 'var(--gd-warm-card)' : 'transparent',
              color: activeTab === 'specs' ? 'var(--gd-terra-600)' : 'var(--gd-text-muted)',
              boxShadow: activeTab === 'specs' ? 'var(--gd-shadow-sm)' : 'none',
            }}
          >
            Area Metrics
          </button>
        </div>
      </div>

      {activeTab === '2d' ? (
        <div>
          {/* Architectural SVG Schematic */}
          <div
            style={{
              background: 'linear-gradient(180deg, #0b1120 0%, #0f172a 100%)',
              border: '1px solid #1e293b',
              borderRadius: 'var(--gd-radius-md)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox="0 0 600 320"
              style={{ width: '100%', maxHeight: '280px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
            >
              {/* Grid Background Lines */}
              <defs>
                <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="600" height="320" fill="url(#cad-grid)" />

              {/* Exterior Boundary Wall */}
              <rect x="30" y="20" width="540" height="280" fill="none" stroke="#6366f1" strokeWidth="3" rx="4" />

              {/* Living & Dining Room */}
              <rect x="40" y="30" width="260" height="170" fill="rgba(99, 102, 241, 0.12)" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="170" y="105" fill="#f8fafc" fontSize="14" fontWeight="bold" textAnchor="middle">
                Living &amp; Dining Area
              </text>
              <text x="170" y="125" fill="#94a3b8" fontSize="11" textAnchor="middle">
                ~ {livingSqft} sq.ft
              </text>

              {/* Master Bedroom */}
              <rect x="310" y="30" width="250" height="170" fill="rgba(16, 185, 129, 0.12)" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="435" y="105" fill="#f8fafc" fontSize="14" fontWeight="bold" textAnchor="middle">
                Master Bedroom + Bath
              </text>
              <text x="435" y="125" fill="#94a3b8" fontSize="11" textAnchor="middle">
                ~ {masterBedSqft} sq.ft
              </text>

              {/* Kitchen */}
              <rect x="40" y="210" width="160" height="80" fill="rgba(245, 158, 11, 0.12)" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="120" y="248" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
                Modular Kitchen
              </text>
              <text x="120" y="265" fill="#94a3b8" fontSize="10" textAnchor="middle">
                ~ {kitchenSqft} sq.ft
              </text>

              {/* Second Bedroom or Balcony */}
              <rect x="210" y="210" width="200" height="80" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="310" y="248" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
                {bhk >= 2 ? `Bedroom 2 (~ ${secondBedSqft} sq.ft)` : 'Study / Lounge'}
              </text>

              {/* Balcony Deck */}
              <rect x="420" y="210" width="140" height="80" fill="rgba(236, 72, 153, 0.12)" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="490" y="248" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
                Deck Balcony
              </text>
              <text x="490" y="265" fill="#94a3b8" fontSize="10" textAnchor="middle">
                ~ {balconySqft} sq.ft
              </text>
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--gd-text-muted)' }}>
            <span>* Illustrative layout based on standard {bhk} BHK floor configurations</span>
            <span style={{ fontWeight: 600, color: 'var(--gd-text-charcoal)' }}>Carpet Area Ratio: {efficiencyPct}%</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: 'var(--gd-warm-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
              Super Built-up Area
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gd-text-charcoal)', marginTop: '4px' }}>
              {builtup} sq.ft
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--gd-text-slate)' }}>
              Includes common areas, corridors, and club amenities share
            </p>
          </div>

          <div style={{ background: 'var(--gd-warm-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
              Carpet Area
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {carpet} sq.ft
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--gd-text-slate)' }}>
              {specs.carpetAreaSqft ? 'Verified RERA usable internal area' : 'Estimated internal wall-to-wall space'}
            </p>
          </div>

          <div style={{ background: 'var(--gd-warm-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
              Space Efficiency
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gd-terra-600)', marginTop: '4px' }}>
              {efficiencyPct}% Usable
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--gd-text-slate)' }}>
              Loading factor: {100 - efficiencyPct}% (Optimal standard range: 18-22%)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
