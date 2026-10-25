import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Compass,
  Building,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from 'lucide-react';
import { PropertyListing } from '../../types/property';
import { SmartMatchResult } from '../../services/smartSearchService';
import { ChevronDown, ChevronUp, CheckCircle2, Sliders } from 'lucide-react';

interface SearchResultCardProps {
  property: PropertyListing;
  isSaved: boolean;
  onToggleSave: (property: PropertyListing) => void;
  isCompared: boolean;
  onToggleCompare: (property: PropertyListing) => void;
  matchResult?: SmartMatchResult;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  property,
  isSaved,
  onToggleSave,
  isCompared,
  onToggleCompare,
  matchResult,
}) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const images = property.images && property.images.length > 0 ? property.images : [];
  const currentImg = images[activeImgIndex];

  const handleNextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 0) {
      setActiveImgIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 0) {
      setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className={`gd-result-card ${isCompared ? 'compared' : ''}`}>
      {/* Left: Media Gallery Container */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          minHeight: '240px',
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
        }}
      >
        <Link to={`/property/${property.slug}`} tabIndex={-1} aria-hidden="true" style={{ display: 'block', height: '100%' }}>
          {imgError || !currentImg ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--gd-text-muted)',
                gap: '8px',
                background: 'var(--gd-warm-bg)',
              }}
            >
              <ImageOff size={32} />
              <span style={{ fontSize: '12px' }}>Photo Preview Unavailable</span>
            </div>
          ) : (
            <img
              src={currentImg}
              alt={property.title}
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              loading="lazy"
            />
          )}
        </Link>

        {/* Gallery Next / Prev Arrows */}
        {images.length > 1 && !imgError && (
          <>
            <button
              type="button"
              onClick={handlePrevImg}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.5)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextImg}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.5)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
              aria-label="Next photo"
            >
              <ChevronRight size={16} />
            </button>

            {/* Photo Counter Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                zIndex: 2,
              }}
            >
              {activeImgIndex + 1} / {images.length}
            </div>
          </>
        )}

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', zIndex: 2 }}>
          <span className="gd-tag gd-tag-demo" title="Benchmark record for model evaluation">
            Benchmark Demo
          </span>
          {property.specs.possessionStatus === 'Ready to Move' && (
            <span className="gd-tag gd-tag-ready">Ready</span>
          )}
        </div>

        {/* Save Bookmark Button */}
        <button
          type="button"
          onClick={() => onToggleSave(property)}
          className={`gd-card-save-btn ${isSaved ? 'saved' : ''}`}
          style={{ top: '10px', right: '10px' }}
          title={isSaved ? 'Remove from Saved' : 'Save Property'}
          aria-label={isSaved ? 'Remove from Saved' : 'Save Property'}
        >
          <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : 'currentColor'} />
        </button>
      </div>

      {/* Right: Content Details */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Top Pricing & Status */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd-text-charcoal)', fontFamily: 'JetBrains Mono, monospace' }}>
                {property.priceFormatted}
              </span>
              {property.pricePerSqft > 0 && (
                <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)', fontWeight: 600 }}>
                  ₹{Math.round(property.pricePerSqft).toLocaleString()}/sq.ft
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'var(--gd-warm-bg)', color: 'var(--gd-text-slate)', fontWeight: 600 }}>
              {property.specs.furnishing || 'Semi-Furnished'}
            </span>
            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'var(--gd-warm-bg)', color: 'var(--gd-text-slate)', fontWeight: 600 }}>
              {property.sellerLabel}
            </span>
          </div>
        </div>

        {/* Title & Locality */}
        <div>
          <Link to={`/property/${property.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--gd-text-charcoal)', lineHeight: 1.3 }}>
              {property.title}
            </h3>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13.5px', color: 'var(--gd-text-slate)' }}>
            <MapPin size={14} color="var(--gd-terra-500)" />
            <span>
              {property.location.subLocality ? `${property.location.subLocality}, ` : ''}
              {property.location.locality}, {property.location.city}
            </span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'var(--gd-warm-bg)',
            borderRadius: 'var(--gd-radius-md)',
            border: '1px solid var(--gd-warm-border)',
          }}
        >
          {property.specs.bhk > 0 && (
            <div>
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700, display: 'block' }}>Config</span>
              <strong style={{ fontSize: '13px', color: 'var(--gd-text-charcoal)' }}>{property.specs.bhk} BHK</strong>
            </div>
          )}
          <div>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700, display: 'block' }}>Super Area</span>
            <strong style={{ fontSize: '13px', color: 'var(--gd-text-charcoal)' }}>{property.specs.builtupAreaSqft} sqft</strong>
          </div>
          <div>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700, display: 'block' }}>Bathrooms</span>
            <strong style={{ fontSize: '13px', color: 'var(--gd-text-charcoal)' }}>{property.specs.bathrooms} Baths</strong>
          </div>
          <div>
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700, display: 'block' }}>Age</span>
            <strong style={{ fontSize: '13px', color: 'var(--gd-text-charcoal)' }}>{property.specs.ageYears ?? 2} Yrs</strong>
          </div>
        </div>

        {/* Amenities Chips */}
        {property.amenities && property.amenities.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {property.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                style={{
                  fontSize: '11.5px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(0, 0, 0, 0.04)',
                  color: 'var(--gd-text-slate)',
                  fontWeight: 500,
                }}
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Explainable Smart Match Scoring Breakdown */}
        {matchResult && (
          <div
            style={{
              backgroundColor: matchResult.totalScore >= 80 ? 'rgba(234, 88, 12, 0.06)' : 'var(--gd-warm-bg)',
              border: `1px solid ${matchResult.totalScore >= 80 ? 'rgba(234, 88, 12, 0.25)' : 'var(--gd-warm-border)'}`,
              borderRadius: 'var(--gd-radius-md)',
              padding: '10px 12px',
              marginTop: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor: matchResult.totalScore >= 80 ? 'var(--gd-terra-600)' : '#475569',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {matchResult.totalScore}% Match
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-charcoal)' }}>
                  {matchResult.matchGrade} Compatibility
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowBreakdown((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gd-terra-600)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                <span>{showBreakdown ? 'Hide Ranking Criteria' : 'Why Ranked Here?'}</span>
                {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Quick matched tags */}
            {matchResult.tags.length > 0 && !showBreakdown && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {matchResult.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      color: 'var(--gd-text-charcoal)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--gd-warm-border)',
                      fontWeight: 600,
                    }}
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>
            )}

            {/* Expandable Granular Criteria Breakdown */}
            {showBreakdown && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--gd-warm-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {matchResult.criteria.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      fontSize: '11.5px',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={13} color={c.score >= 70 ? '#16a34a' : 'var(--gd-text-muted)'} />
                      <span style={{ fontWeight: 700, color: 'var(--gd-text-charcoal)' }}>{c.name}:</span>
                      <span style={{ color: 'var(--gd-text-slate)' }}>{c.explanation}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--gd-text-charcoal)', whiteSpace: 'nowrap' }}>
                      +{c.contribution} pts
                    </div>
                  </div>
                ))}

                <div style={{ fontSize: '10.5px', color: 'var(--gd-text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                  Deterministic Multi-Attribute Relevance Engine: Ranked by exact mathematical matching against real listing attributes, not a subjective black-box model.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '10px',
            borderTop: '1px solid var(--gd-warm-border)',
          }}
        >
          {/* Comparison Checkbox */}
          <label className="gd-toggle-label" style={{ fontSize: '12.5px' }}>
            <input
              type="checkbox"
              checked={isCompared}
              onChange={() => onToggleCompare(property)}
            />
            <span>Add to Compare</span>
          </label>

          {/* AI Valuation Link & Details Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to={`/property/${property.slug}#ai-valuation`}
              className="gd-ai-estimate-chip"
              style={{ textDecoration: 'none' }}
              title="Inspect AST-XGB fair valuation"
            >
              <Sparkles size={12} />
              <span>AI Valuation</span>
            </Link>

            <Link
              to={`/property/${property.slug}`}
              className="gd-btn-search"
              style={{
                height: '34px',
                padding: '0 16px',
                fontSize: '13px',
                textDecoration: 'none',
                borderRadius: 'var(--gd-radius-md)',
              }}
            >
              <span>View Details</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
