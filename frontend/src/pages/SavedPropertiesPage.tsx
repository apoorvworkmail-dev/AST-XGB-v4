import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Scale,
  Trash2,
  Download,
  Share2,
  Building,
  MapPin,
  Bed,
  Maximize2,
  Bath,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { getListingsByIds } from '../services/listingsAdapter';
import { storageAdapter, MAX_COMPARE_LIMIT } from '../services/storageAdapter';
import { PropertyListing } from '../types/property';

interface SavedPropertiesPageProps {
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
  onClearSaved?: () => void;
}

export const SavedPropertiesPage: React.FC<SavedPropertiesPageProps> = ({
  savedIds,
  onToggleSave,
  onClearSaved,
}) => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch actual listing records matching savedIds
  useEffect(() => {
    setLoading(true);
    if (savedIds.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    getListingsByIds(savedIds)
      .then((items) => {
        setProperties(items);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load shortlisted properties:', err);
        setLoading(false);
      });
  }, [savedIds]);

  const handleRemove = (property: PropertyListing) => {
    onToggleSave(property);
    setSelectedForCompare((prev) => prev.filter((id) => id !== property.id));
    setNotification(`Removed "${property.title}" from your shortlist.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all properties from your shortlist?')) {
      storageAdapter.clearAllSavedProperties();
      if (onClearSaved) {
        onClearSaved();
      }
      setProperties([]);
      setSelectedForCompare([]);
      setNotification('Shortlist cleared.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleCompareSelection = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= MAX_COMPARE_LIMIT) {
        alert(`You can select up to ${MAX_COMPARE_LIMIT} properties for side-by-side comparison.`);
        return;
      }
      setSelectedForCompare((prev) => [...prev, id]);
    }
  };

  const handleCompareSelected = () => {
    const idsToCompare = selectedForCompare.length > 0 ? selectedForCompare : properties.slice(0, MAX_COMPARE_LIMIT).map((p) => p.id);
    if (idsToCompare.length < 2) {
      alert('Please select at least 2 properties to compare side-by-side.');
      return;
    }
    navigate(`/tools/compare?ids=${idsToCompare.join(',')}`);
  };

  const handleExportCSV = () => {
    if (properties.length === 0) return;
    const headers = ['ID', 'Title', 'City', 'Locality', 'Type', 'BHK', 'Area (sqft)', 'Price (INR)', 'Price/SqFt', 'Possession', 'Attribution'];
    const rows = properties.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.location.city,
      p.location.locality,
      p.propertyType,
      p.specs.bhk,
      p.specs.builtupAreaSqft,
      p.price,
      p.pricePerSqft,
      p.specs.possessionStatus,
      `"${p.datasetAttribution}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ast_xgb_shortlist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="gd-consumer-app" style={{ minHeight: 'calc(100vh - 68px)', padding: '32px 0 60px 0' }}>
      <div className="gd-container">
        {/* Header Banner */}
        <div
          style={{
            backgroundColor: 'var(--gd-warm-card)',
            border: '1px solid var(--gd-warm-border)',
            borderRadius: 'var(--gd-radius-xl)',
            padding: '28px',
            marginBottom: '28px',
            boxShadow: 'var(--gd-shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="gd-tag" style={{ background: 'var(--gd-terra-50)', color: 'var(--gd-terra-600)', fontWeight: 800 }}>
                My Portfolio
              </span>
              <span style={{ fontSize: '12.5px', color: 'var(--gd-text-muted)' }}>
                {properties.length} {properties.length === 1 ? 'Property' : 'Properties'} Shortlisted
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--gd-text-charcoal)', margin: '0 0 4px 0' }}>
              Shortlisted Properties
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--gd-text-slate)' }}>
              Saved listings and benchmarks preserved across your browser sessions for evaluation.
            </p>
          </div>

          {properties.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="gd-btn-search"
                onClick={handleCompareSelected}
                style={{
                  height: '40px',
                  padding: '0 18px',
                  fontSize: '13px',
                }}
              >
                <Scale size={15} />
                <span>
                  Compare {selectedForCompare.length > 0 ? `(${selectedForCompare.length})` : 'All'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: 'var(--gd-radius-md)',
                  border: '1px solid var(--gd-warm-border)',
                  background: 'var(--gd-warm-bg)',
                  color: 'var(--gd-text-charcoal)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Download size={15} />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  height: '40px',
                  padding: '0 14px',
                  borderRadius: 'var(--gd-radius-md)',
                  border: '1px solid #fee2e2',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                title="Remove all saved properties"
              >
                <Trash2 size={15} />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Transient Notification */}
        {notification && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spin" style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--gd-warm-border)', borderTopColor: 'var(--gd-terra-500)', borderRadius: '50%', marginBottom: '12px' }} />
            <div style={{ color: 'var(--gd-text-muted)', fontSize: '14px' }}>Loading your shortlisted properties...</div>
          </div>
        ) : properties.length === 0 ? (
          /* Empty State */
          <div
            style={{
              backgroundColor: 'var(--gd-warm-card)',
              border: '1px solid var(--gd-warm-border)',
              borderRadius: 'var(--gd-radius-xl)',
              padding: '60px 24px',
              textAlign: 'center',
              boxShadow: 'var(--gd-shadow-sm)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Heart size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gd-text-charcoal)', marginBottom: '8px' }}>
              Your Shortlist is Empty
            </h3>

            <p style={{ color: 'var(--gd-text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              You haven&apos;t shortlisted any properties yet. Click the heart icon on any property in search results or details pages to save it here for side-by-side comparison.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/buy" className="gd-btn-search" style={{ textDecoration: 'none' }}>
                Browse Buy Listings
              </Link>
              <Link to="/rent" className="gd-btn-search" style={{ background: 'var(--gd-warm-bg)', color: 'var(--gd-text-charcoal)', border: '1px solid var(--gd-warm-border)', textDecoration: 'none' }}>
                Explore Rental Properties
              </Link>
            </div>
          </div>
        ) : (
          /* Shortlisted Properties Grid */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {properties.map((prop) => {
                const isSelected = selectedForCompare.includes(prop.id);
                return (
                  <div
                    key={prop.id}
                    style={{
                      backgroundColor: 'var(--gd-warm-card)',
                      border: isSelected ? '2px solid var(--gd-terra-500)' : '1px solid var(--gd-warm-border)',
                      borderRadius: 'var(--gd-radius-lg)',
                      overflow: 'hidden',
                      boxShadow: 'var(--gd-shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                    }}
                  >
                    {/* Media Cover */}
                    <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                      <Link to={`/property/${prop.slug}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                        <img
                          src={prop.images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'}
                          alt={prop.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Link>

                      {/* Badges */}
                      <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                        {prop.isVerified && <span className="gd-tag gd-tag-verified">Verified</span>}
                        <span className="gd-tag" style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#ffffff' }}>
                          {prop.propertyType}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(prop)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Remove from shortlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        {/* Price Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                          <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--gd-text-charcoal)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {prop.priceFormatted}
                          </span>
                          {prop.pricePerSqft > 0 && (
                            <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                              ₹{Math.round(prop.pricePerSqft).toLocaleString()}/sq.ft
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <Link
                          to={`/property/${prop.slug}`}
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            color: 'var(--gd-text-charcoal)',
                            textDecoration: 'none',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            marginBottom: '8px',
                          }}
                        >
                          {prop.title}
                        </Link>

                        {/* Location */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gd-text-muted)', marginBottom: '14px' }}>
                          <MapPin size={14} color="var(--gd-terra-500)" style={{ flexShrink: 0 }} />
                          <span>{prop.location.locality}, {prop.location.city}</span>
                        </div>

                        {/* Specs Chips */}
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', color: 'var(--gd-text-slate)', paddingBottom: '14px', borderBottom: '1px solid var(--gd-warm-border)' }}>
                          {prop.specs.bhk > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Bed size={14} color="var(--gd-terra-500)" /> {prop.specs.bhk} BHK
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Maximize2 size={14} color="var(--gd-terra-500)" /> {prop.specs.builtupAreaSqft} sq.ft
                          </span>
                          {prop.specs.bathrooms > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Bath size={14} color="var(--gd-terra-500)" /> {prop.specs.bathrooms} Bath
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div style={{ paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, color: 'var(--gd-text-charcoal)' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCompareSelection(prop.id)}
                            style={{ accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                          />
                          <span>Select to Compare</span>
                        </label>

                        <Link
                          to={`/property/${prop.slug}`}
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--gd-terra-600)',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>View Details</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
