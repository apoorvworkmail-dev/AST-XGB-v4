import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import { PropertyListing } from '../../types/property';

interface ComparisonFloatingTrayProps {
  comparedProperties: PropertyListing[];
  onRemoveFromCompare: (propertyId: string) => void;
  onClearCompare: () => void;
}

export const ComparisonFloatingTray: React.FC<ComparisonFloatingTrayProps> = ({
  comparedProperties,
  onRemoveFromCompare,
  onClearCompare,
}) => {
  if (comparedProperties.length === 0) return null;

  const compareIds = comparedProperties.map((p) => p.id).join(',');

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: 'var(--gd-warm-card)',
        border: '1.5px solid var(--gd-terra-500)',
        borderRadius: 'var(--gd-radius-xl)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        maxWidth: '90vw',
      }}
      role="region"
      aria-label="Comparison Tray"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--gd-terra-50)',
            color: 'var(--gd-terra-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Scale size={18} />
        </div>
        <div>
          <strong style={{ fontSize: '13.5px', color: 'var(--gd-text-charcoal)', display: 'block' }}>
            {comparedProperties.length} of 4 Selected
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>
            Compare specifications &amp; AI valuations
          </span>
        </div>
      </div>

      {/* Mini Thumbnails */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {comparedProperties.map((prop) => (
          <div
            key={prop.id}
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--gd-warm-border)',
            }}
            title={prop.title}
          >
            <img
              src={prop.images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=100&q=80'}
              alt={prop.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => onRemoveFromCompare(prop.id)}
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label={`Remove ${prop.title} from compare`}
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={onClearCompare}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gd-text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '6px',
          }}
        >
          Clear
        </button>

        <Link
          to={`/tools/compare?ids=${compareIds}`}
          className="gd-btn-search"
          style={{
            height: '38px',
            padding: '0 18px',
            fontSize: '13px',
            textDecoration: 'none',
            borderRadius: 'var(--gd-radius-md)',
          }}
        >
          <span>Compare Now</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
