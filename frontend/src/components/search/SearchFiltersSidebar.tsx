import React from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Building,
  MapPin,
  IndianRupee,
  Maximize2,
  Calendar,
  Check,
} from 'lucide-react';
import {
  PropertySearchQuery,
  PropertyType,
  FurnishingStatus,
  PossessionStatus,
  SellerType,
} from '../../types/property';
import { CITY_LOCALITIES } from '../../data/cityLocalities';

interface SearchFiltersSidebarProps {
  query: PropertySearchQuery;
  onUpdateQuery: (updates: Partial<PropertySearchQuery>) => void;
  onReset: () => void;
  availableLocalities: string[];
}

export const SearchFiltersSidebar: React.FC<SearchFiltersSidebarProps> = ({
  query,
  onUpdateQuery,
  onReset,
  availableLocalities,
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = React.useState(false);
  const currentCity = query.city || 'Bengaluru';
  const cityLocList = CITY_LOCALITIES[currentCity] || availableLocalities;

  const handleBhkToggle = (bhkVal: number) => {
    const current = query.bhk || [];
    const next = current.includes(bhkVal)
      ? current.filter((b) => b !== bhkVal)
      : [...current, bhkVal];
    onUpdateQuery({ bhk: next.length > 0 ? next : undefined, page: 1 });
  };

  const handleBathroomsToggle = (bathVal: number) => {
    const current = query.bathrooms || [];
    const next = current.includes(bathVal)
      ? current.filter((b) => b !== bathVal)
      : [...current, bathVal];
    onUpdateQuery({ bathrooms: next.length > 0 ? next : undefined, page: 1 });
  };

  const handleFurnishingToggle = (fVal: FurnishingStatus) => {
    const current = query.furnishing || [];
    const next = current.includes(fVal)
      ? current.filter((f) => f !== fVal)
      : [...current, fVal];
    onUpdateQuery({ furnishing: next.length > 0 ? next : undefined, page: 1 });
  };

  const handlePossessionToggle = (pVal: PossessionStatus) => {
    const current = query.possessionStatus || [];
    const next = current.includes(pVal)
      ? current.filter((p) => p !== pVal)
      : [...current, pVal];
    onUpdateQuery({ possessionStatus: next.length > 0 ? next : undefined, page: 1 });
  };

  const handleSellerToggle = (sVal: SellerType) => {
    const current = query.sellerType || [];
    const next = current.includes(sVal)
      ? current.filter((s) => s !== sVal)
      : [...current, sVal];
    onUpdateQuery({ sellerType: next.length > 0 ? next : undefined, page: 1 });
  };

  return (
    <aside
      className="gd-filter-sidebar"
      style={{
        backgroundColor: 'var(--gd-warm-card)',
        border: '1px solid var(--gd-warm-border)',
        borderRadius: 'var(--gd-radius-lg)',
        padding: '20px',
        boxShadow: 'var(--gd-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-label="Filter Properties"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--gd-warm-border)' }}>
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          aria-expanded={isMobileExpanded}
        >
          <SlidersHorizontal size={18} color="var(--gd-terra-500)" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--gd-text-charcoal)' }}>
            Filter Listings
          </h3>
          <span
            className="gd-mobile-filter-badge"
            style={{
              fontSize: '11px',
              backgroundColor: 'var(--gd-terra-50)',
              color: 'var(--gd-terra-600)',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            {isMobileExpanded ? '▲ Hide' : '▼ Options'}
          </span>
        </button>

        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gd-terra-600)',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Filter Body Container */}
      <div className={`gd-filter-body ${isMobileExpanded ? 'is-expanded' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '22px', marginTop: '20px' }}>

      {/* 1. Metro City */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Metro City
        </label>
        <select
          className="gd-search-select"
          value={query.city || 'All Cities'}
          onChange={(e) => onUpdateQuery({ city: e.target.value === 'All Cities' ? undefined : e.target.value, locality: undefined, page: 1 })}
          style={{ padding: '9px 12px', fontSize: '13.5px' }}
        >
          <option value="All Cities">All 7 Metros</option>
          {Object.keys(CITY_LOCALITIES).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Locality */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Locality
        </label>
        <select
          className="gd-search-select"
          value={query.locality || ''}
          onChange={(e) => onUpdateQuery({ locality: e.target.value || undefined, page: 1 })}
          style={{ padding: '9px 12px', fontSize: '13.5px' }}
        >
          <option value="">All Localities in {currentCity}</option>
          {cityLocList.slice(0, 40).map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', marginTop: '4px', display: 'block' }}>
          Alias aware: Matches landmarks & tech hubs (ITPL, BKC, Cyberabad, Manyata, OMR).
        </span>
      </div>

      {/* 3. Property Type */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Property Type
        </label>
        <select
          className="gd-search-select"
          value={query.propertyType || 'All Types'}
          onChange={(e) => onUpdateQuery({ propertyType: e.target.value === 'All Types' ? undefined : e.target.value, page: 1 })}
          style={{ padding: '9px 12px', fontSize: '13.5px' }}
        >
          <option value="All Types">All Property Types</option>
          <option value="Apartment">Apartment / Flat</option>
          <option value="Villa">Villa / Row House</option>
          <option value="Builder Floor">Builder Floor</option>
          <option value="Plot">Plot / Land</option>
          <option value="Commercial Office">Commercial Office</option>
        </select>
      </div>

      {/* 3b. Commute & Transit Priorities (Smart Search) */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Commute & Transit Priority
        </label>
        <select
          className="gd-search-select"
          value={query.commutePriority || 'none'}
          onChange={(e) =>
            onUpdateQuery({
              commutePriority: e.target.value as any,
              sortBy: e.target.value !== 'none' ? 'smart_match' : query.sortBy,
              page: 1,
            })
          }
          style={{ padding: '9px 12px', fontSize: '13px' }}
        >
          <option value="none">Standard Transit</option>
          <option value="metro">🚇 Near Metro Station (&lt; 1.5 km)</option>
          <option value="tech_corridor">💼 Major IT / Tech Hub</option>
          <option value="airport">✈️ Airport Expressway Access</option>
          <option value="peaceful">🌿 Quiet Residential Enclave</option>
        </select>
      </div>

      {/* 4. Bedrooms (BHK) */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Bedrooms (BHK)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {[1, 2, 3, 4].map((bhkVal) => {
            const isSelected = query.bhk?.includes(bhkVal);
            return (
              <button
                key={bhkVal}
                type="button"
                className={`gd-bhk-pill ${isSelected ? 'active' : ''}`}
                onClick={() => handleBhkToggle(bhkVal)}
                style={{ textAlign: 'center', padding: '6px 4px', fontSize: '12.5px' }}
              >
                {bhkVal === 4 ? '4+' : `${bhkVal}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Bathrooms */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Bathrooms
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {[1, 2, 3].map((bathVal) => {
            const isSelected = query.bathrooms?.includes(bathVal);
            return (
              <button
                key={bathVal}
                type="button"
                className={`gd-bhk-pill ${isSelected ? 'active' : ''}`}
                onClick={() => handleBathroomsToggle(bathVal)}
                style={{ textAlign: 'center', padding: '6px 4px', fontSize: '12.5px' }}
              >
                {bathVal === 3 ? '3+ Baths' : `${bathVal} Bath`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Budget Range */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Budget Range (INR)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input
            type="number"
            placeholder="Min Price"
            className="gd-search-input"
            style={{ padding: '8px 10px', fontSize: '13px' }}
            value={query.minPrice || ''}
            onChange={(e) => onUpdateQuery({ minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          />
          <input
            type="number"
            placeholder="Max Price"
            className="gd-search-input"
            style={{ padding: '8px 10px', fontSize: '13px' }}
            value={query.maxPrice || ''}
            onChange={(e) => onUpdateQuery({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          />
        </div>
      </div>

      {/* 7. Built-up Super Area */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Built-up Area (sq.ft)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input
            type="number"
            placeholder="Min sqft"
            className="gd-search-input"
            style={{ padding: '8px 10px', fontSize: '13px' }}
            value={query.minArea || ''}
            onChange={(e) => onUpdateQuery({ minArea: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          />
          <input
            type="number"
            placeholder="Max sqft"
            className="gd-search-input"
            style={{ padding: '8px 10px', fontSize: '13px' }}
            value={query.maxArea || ''}
            onChange={(e) => onUpdateQuery({ maxArea: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          />
        </div>
      </div>

      {/* 8. Furnishing Status */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Furnishing
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(['Furnished', 'Semi-Furnished', 'Unfurnished'] as FurnishingStatus[]).map((f) => (
            <label key={f} className="gd-toggle-label" style={{ fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={query.furnishing?.includes(f) || false}
                onChange={() => handleFurnishingToggle(f)}
              />
              <span>{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 9. Possession Status */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Possession Status
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(['Ready to Move', 'Under Construction'] as PossessionStatus[]).map((p) => (
            <label key={p} className="gd-toggle-label" style={{ fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={query.possessionStatus?.includes(p) || false}
                onChange={() => handlePossessionToggle(p)}
              />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 10. Project Age */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Max Property Age
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {[
            { label: '<= 2 Yrs', val: 2 },
            { label: '<= 5 Yrs', val: 5 },
            { label: 'Any Age', val: undefined },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={`gd-bhk-pill ${query.maxAgeYears === item.val ? 'active' : ''}`}
              onClick={() => onUpdateQuery({ maxAgeYears: item.val, page: 1 })}
              style={{ textAlign: 'center', padding: '6px 4px', fontSize: '12px' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 11. Seller Type */}
      <div>
        <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gd-text-muted)', display: 'block', marginBottom: '8px' }}>
          Seller Category
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(['Owner', 'Developer', 'Agent'] as SellerType[]).map((s) => (
            <label key={s} className="gd-toggle-label" style={{ fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={query.sellerType?.includes(s) || false}
                onChange={() => handleSellerToggle(s)}
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </div>
      </div>
    </aside>
  );
};
