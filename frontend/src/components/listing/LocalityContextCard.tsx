import React from 'react';
import { MapPin, Navigation, TrendingUp, Bus, Train, Building2, School } from 'lucide-react';
import { PropertyLocation } from '../../types/property';

interface LocalityContextCardProps {
  location: PropertyLocation;
  propertyTitle: string;
}

export const LocalityContextCard: React.FC<LocalityContextCardProps> = ({
  location,
  propertyTitle,
}) => {
  // Generate realistic connectivity metrics based on city & locality
  const isBlr = location.city === 'Bengaluru';
  const isMum = location.city === 'Mumbai';
  const isHyd = location.city === 'Hyderabad';

  const metroStation = isBlr
    ? `${location.locality} Metro (Purple Line) — 1.2 km`
    : isMum
    ? `${location.locality} Suburban / Metro — 800m`
    : isHyd
    ? `${location.locality} Metro (Blue Line) — 1.5 km`
    : `${location.locality} Central Transit Station — 1.8 km`;

  const airportDistance = isBlr ? '38 km (approx. 50 mins via NH 44)' : isMum ? '14 km (approx. 35 mins via WEH)' : '28 km (approx. 40 mins via ORR)';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={19} color="var(--gd-terra-500)" />
            Location &amp; Locality Intelligence
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
            Neighborhood infrastructure &amp; transit connectivity around {location.locality}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
          <TrendingUp size={14} />
          <span>High Demand Micro-market</span>
        </div>
      </div>

      {/* Embedded Vector Geo Locator */}
      <div
        style={{
          height: '200px',
          borderRadius: 'var(--gd-radius-md)',
          background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
          border: '1px solid var(--gd-warm-border)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Subtle Map Graticule Grid */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}
        >
          <pattern id="loc-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#loc-grid)" />
          {/* Simulated arterial roadways */}
          <path d="M 0 60 Q 200 120 400 80 T 800 140" fill="none" stroke="#6366f1" strokeWidth="2.5" />
          <path d="M 100 0 Q 150 100 220 200" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" />
        </svg>

        {/* Pulsing Pin Indicator */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#0f172a',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              border: '2px solid var(--gd-terra-500)',
            }}
          >
            <MapPin size={16} color="var(--gd-terra-500)" fill="var(--gd-terra-500)" />
            <span>{location.locality}, {location.city}</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#cbd5e1', fontFamily: 'JetBrains Mono, monospace' }}>
            GPS: {location.latitude.toFixed(4)}° N, {location.longitude.toFixed(4)}° E
          </div>
        </div>
      </div>

      {/* Transit & Infrastructure Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gd-warm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gd-terra-600)', border: '1px solid var(--gd-warm-border)' }}>
            <Train size={16} />
          </div>
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--gd-text-charcoal)', display: 'block' }}>Rapid Transit / Metro</strong>
            <span style={{ fontSize: '12.5px', color: 'var(--gd-text-slate)' }}>{metroStation}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gd-warm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gd-terra-600)', border: '1px solid var(--gd-warm-border)' }}>
            <Navigation size={16} />
          </div>
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--gd-text-charcoal)', display: 'block' }}>Airport Access</strong>
            <span style={{ fontSize: '12.5px', color: 'var(--gd-text-slate)' }}>{airportDistance}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gd-warm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gd-terra-600)', border: '1px solid var(--gd-warm-border)' }}>
            <Building2 size={16} />
          </div>
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--gd-text-charcoal)', display: 'block' }}>Employment Hubs</strong>
            <span style={{ fontSize: '12.5px', color: 'var(--gd-text-slate)' }}>Major IT/Commercial Parks within 10-15 mins</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gd-warm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gd-terra-600)', border: '1px solid var(--gd-warm-border)' }}>
            <School size={16} />
          </div>
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--gd-text-charcoal)', display: 'block' }}>Education &amp; Healthcare</strong>
            <span style={{ fontSize: '12.5px', color: 'var(--gd-text-slate)' }}>Top multi-specialty hospitals and schools within 3 km</span>
          </div>
        </div>
      </div>
    </div>
  );
};
