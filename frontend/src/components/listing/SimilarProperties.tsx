import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Sparkles, ChevronRight, Bed, Maximize2, ShieldCheck, MapPin } from 'lucide-react';
import { PropertyListing } from '../../types/property';
import { searchListings } from '../../services/listingsAdapter';
import { getSimilarRecommendations, RecommendedProperty } from '../../services/smartSearchService';

interface SimilarPropertiesProps {
  currentProperty: PropertyListing;
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

export const SimilarProperties: React.FC<SimilarPropertiesProps> = ({
  currentProperty,
  savedIds,
  onToggleSave,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Fetch pool of candidate listings in the same city or category
    searchListings({
      city: currentProperty.location.city,
      pageSize: 20,
    })
      .then((res) => {
        if (!isMounted) return;
        // Compute content-based deterministic multi-factor recommendations
        const recs = getSimilarRecommendations(currentProperty, res.items, 3);
        setRecommendations(recs);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentProperty.id, currentProperty.location.city, currentProperty.propertyType]);

  if (!loading && recommendations.length === 0) return null;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--gd-text-charcoal)' }}>
              Intelligent Property Recommendations
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'var(--gd-terra-50)',
                color: 'var(--gd-terra-600)',
                border: '1px solid var(--gd-terra-200)',
              }}
            >
              Deterministic Content-Match
            </span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
            Ranked by multi-factor attribute distance to {currentProperty.title} in {currentProperty.location.city}
          </span>
        </div>

        <Link
          to={`/search?city=${encodeURIComponent(currentProperty.location.city)}`}
          style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gd-terra-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          View all in {currentProperty.location.city}
          <ChevronRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ height: '220px', borderRadius: '8px', background: 'var(--gd-warm-bg)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {recommendations.map(({ property: prop, similarityScore, similarityGrade, overlapReasons, distanceKm }) => (
            <div
              key={prop.id}
              style={{
                borderRadius: 'var(--gd-radius-md)',
                border: '1px solid var(--gd-warm-border)',
                background: 'var(--gd-warm-bg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ height: '130px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={prop.images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'}
                  alt={prop.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: similarityScore >= 85 ? 'var(--gd-terra-600)' : '#0f172a',
                    color: '#ffffff',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {similarityScore}% Match • {similarityGrade}
                </span>

                <span
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  {prop.priceFormatted}
                </span>
              </div>

              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <Link
                    to={`/property/${prop.slug}`}
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: 'var(--gd-text-charcoal)',
                      textDecoration: 'none',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '4px',
                    }}
                  >
                    {prop.title}
                  </Link>

                  <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="var(--gd-terra-500)" />
                    <span>
                      {prop.location.locality}, {prop.location.city}
                      {distanceKm !== undefined && ` (${distanceKm} km away)`}
                    </span>
                  </div>

                  {/* Overlap Reasons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                    {overlapReasons.map((reason, idx) => (
                      <span key={idx} style={{ fontSize: '11px', color: 'var(--gd-text-slate)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--gd-text-slate)', paddingTop: '10px', borderTop: '1px solid var(--gd-warm-border)' }}>
                  {prop.specs.bhk > 0 && <span>{prop.specs.bhk} BHK</span>}
                  <span>{prop.specs.builtupAreaSqft} sq.ft</span>
                  <Link to={`/property/${prop.slug}`} style={{ color: 'var(--gd-terra-600)', fontWeight: 700, textDecoration: 'none' }}>
                    Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transparent Recommendation Safeguards & Consent Notice */}
      <div
        style={{
          marginTop: '18px',
          padding: '10px 14px',
          borderRadius: 'var(--gd-radius-md)',
          backgroundColor: 'var(--gd-warm-bg)',
          border: '1px solid var(--gd-warm-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11.5px',
          color: 'var(--gd-text-muted)',
        }}
      >
        <ShieldCheck size={16} color="var(--gd-terra-600)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Privacy & Safeguard Guarantee:</strong> Recommendations are derived strictly from the active property's physical specifications and locality. Cross-session personalized user tracking is disabled by default until explicit account consent is granted.
        </span>
      </div>
    </div>
  );
};
