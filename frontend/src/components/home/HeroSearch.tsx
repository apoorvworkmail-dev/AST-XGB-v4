import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Building,
  IndianRupee,
  Home,
  Briefcase,
  Layers,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';
import { CITY_LOCALITIES } from '../../data/cityLocalities';
import { TransactionMode } from '../../types/property';

export const HeroSearch: React.FC = () => {
  const navigate = useNavigate();

  // Mode Tab (Buy, Rent, PG, Plots, Commercial)
  const [activeMode, setActiveMode] = useState<TransactionMode>('buy');

  // Location Autocomplete State
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [selectedLocality, setSelectedLocality] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Property Type
  const [propertyType, setPropertyType] = useState('All Types');

  // Budget Range
  const [budgetMin, setBudgetMin] = useState<number | ''>('');
  const [budgetMax, setBudgetMax] = useState<number | ''>('');

  // BHK Filter
  const [selectedBhk, setSelectedBhk] = useState<number[]>([]);

  // Status Toggles
  const [readyToMove, setReadyToMove] = useState(false);
  const [ownerListed, setOwnerListed] = useState(false);

  // Form Validation Message
  const [validationError, setValidationError] = useState<string | null>(null);

  // Suggestions computation from cityLocalities.ts
  const suggestions = React.useMemo(() => {
    if (!locationQuery || locationQuery.trim().length < 2) {
      // Suggest top localities for currently selected city
      const cityLocs = CITY_LOCALITIES[selectedCity] || [];
      return cityLocs.slice(0, 8).map((loc) => ({
        city: selectedCity,
        locality: loc,
      }));
    }

    const query = locationQuery.toLowerCase().trim();
    const results: Array<{ city: string; locality: string }> = [];

    // Search across all 7 cities in cityLocalities
    for (const [cityName, localities] of Object.entries(CITY_LOCALITIES)) {
      if (cityName.toLowerCase().includes(query)) {
        results.push({ city: cityName, locality: 'All Localities' });
      }
      for (const loc of localities) {
        if (loc.toLowerCase().includes(query)) {
          results.push({ city: cityName, locality: loc });
          if (results.length >= 10) break;
        }
      }
      if (results.length >= 10) break;
    }
    return results;
  }, [locationQuery, selectedCity]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (city: string, locality: string) => {
    setSelectedCity(city);
    setSelectedLocality(locality === 'All Localities' ? '' : locality);
    setLocationQuery(locality === 'All Localities' ? city : `${locality}, ${city}`);
    setIsAutocompleteOpen(false);
    setValidationError(null);
  };

  const toggleBhk = (bhk: number) => {
    if (selectedBhk.includes(bhk)) {
      setSelectedBhk(selectedBhk.filter((b) => b !== bhk));
    } else {
      setSelectedBhk([...selectedBhk, bhk]);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Construct structured URL search params
    const params = new URLSearchParams();
    params.set('mode', activeMode);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedLocality) params.set('locality', selectedLocality);
    if (propertyType && propertyType !== 'All Types') params.set('type', propertyType);
    if (budgetMin !== '') params.set('min_price', budgetMin.toString());
    if (budgetMax !== '') params.set('max_price', budgetMax.toString());
    if (selectedBhk.length > 0) params.set('bhk', selectedBhk.join(','));
    if (readyToMove) params.set('ready_to_move', 'true');
    if (ownerListed) params.set('owner_listed', 'true');

    navigate(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isAutocompleteOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        const item = suggestions[highlightedIndex];
        handleSelectSuggestion(item.city, item.locality);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === 'Escape') {
      setIsAutocompleteOpen(false);
    }
  };

  return (
    <section className="gd-hero-section">
      <div className="gd-container">
        {/* Headline & Mission Copy */}
        <div className="gd-hero-headline">
          <div className="gd-hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Indian Real Estate Discovery</span>
          </div>
          <h2>
            Find a Home That Fits Your <span>Life &amp; Budget</span>
          </h2>
          <p>
            Explore verified residential and commercial listings backed by the{' '}
            <strong>AST-XGB Multi-Model AI Valuation Engine</strong> with conformal confidence intervals across 7 Indian metros.
          </p>
        </div>

        {/* Hero Search Box Card */}
        <div className="gd-search-card" ref={dropdownRef}>
          {/* Transaction Mode Tabs */}
          <div className="gd-search-tabs" role="tablist" aria-label="Transaction Mode">
            {[
              { id: 'buy', label: 'Buy' },
              { id: 'rent', label: 'Rent' },
              { id: 'pg', label: 'PG / Co-living' },
              { id: 'plots', label: 'Plots / Land' },
              { id: 'commercial', label: 'Commercial' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeMode === tab.id}
                className={`gd-search-tab ${activeMode === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveMode(tab.id as TransactionMode);
                  if (tab.id === 'commercial') setPropertyType('Commercial Office');
                  else if (tab.id === 'plots') setPropertyType('Plot');
                  else if (propertyType === 'Commercial Office' || propertyType === 'Plot') setPropertyType('All Types');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input Body */}
          <form className="gd-search-body" onSubmit={handleSearchSubmit}>
            <div className="gd-search-grid">
              {/* Field 1: Location & Locality Autocomplete */}
              <div className="gd-field-group">
                <label htmlFor="search-location">
                  <MapPin size={13} />
                  <span>City or Locality</span>
                </label>
                <div className="gd-input-wrapper">
                  <Search size={18} className="gd-input-icon" />
                  <input
                    id="search-location"
                    type="text"
                    className="gd-search-input"
                    placeholder="e.g. Whitefield, Andheri, Gachibowli..."
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setIsAutocompleteOpen(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => setIsAutocompleteOpen(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="autocomplete-results"
                    aria-expanded={isAutocompleteOpen}
                  />
                </div>

                {/* Autocomplete Suggestions Menu */}
                {isAutocompleteOpen && suggestions.length > 0 && (
                  <div id="autocomplete-results" className="gd-autocomplete-menu" role="listbox">
                    <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--gd-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {locationQuery ? 'Matching Locations' : `Popular in ${selectedCity}`}
                    </div>
                    {suggestions.map((item, idx) => (
                      <div
                        key={`${item.city}-${item.locality}-${idx}`}
                        role="option"
                        aria-selected={highlightedIndex === idx}
                        className={`gd-autocomplete-item ${highlightedIndex === idx ? 'highlighted' : ''}`}
                        onClick={() => handleSelectSuggestion(item.city, item.locality)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color="var(--gd-terra-500)" />
                          <span>
                            <strong>{item.locality}</strong>, {item.city}
                          </span>
                        </div>
                        <span className="city-tag">{item.city}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 2: Property Type */}
              <div className="gd-field-group">
                <label htmlFor="search-type">
                  <Building size={13} />
                  <span>Property Type</span>
                </label>
                <div className="gd-input-wrapper">
                  <select
                    id="search-type"
                    className="gd-search-select"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                  >
                    <option value="All Types">All Property Types</option>
                    <option value="Apartment">Apartment / Flat</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Villa">Villa / Row House</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Builder Floor">Builder Floor</option>
                    <option value="Plot">Residential Plot</option>
                    <option value="Commercial Office">Commercial Office</option>
                  </select>
                </div>
              </div>

              {/* Field 3: Budget Range */}
              <div className="gd-field-group">
                <label htmlFor="search-budget-max">
                  <IndianRupee size={13} />
                  <span>Max Budget</span>
                </label>
                <div className="gd-input-wrapper">
                  <select
                    id="search-budget-max"
                    className="gd-search-select"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">Any Budget</option>
                    {activeMode === 'rent' ? (
                      <>
                        <option value="20000">Up to ₹20,000 / mo</option>
                        <option value="35000">Up to ₹35,000 / mo</option>
                        <option value="50000">Up to ₹50,000 / mo</option>
                        <option value="80000">Up to ₹80,000 / mo</option>
                        <option value="150000">Up to ₹1.5 Lac / mo</option>
                      </>
                    ) : (
                      <>
                        <option value="5000000">Up to ₹50 Lakhs</option>
                        <option value="8000000">Up to ₹80 Lakhs</option>
                        <option value="12000000">Up to ₹1.2 Crore</option>
                        <option value="20000000">Up to ₹2.0 Crore</option>
                        <option value="35000000">Up to ₹3.5 Crore</option>
                        <option value="50000000">Up to ₹5.0 Crore</option>
                        <option value="100000000">Up to ₹10.0 Crore+</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Action Button: Search Properties */}
              <button type="submit" className="gd-btn-search" aria-label="Search Properties">
                <Search size={18} />
                <span>Search Properties</span>
              </button>
            </div>

            {/* Sub-bar: BHK Pills and Quick Toggles */}
            <div className="gd-search-subbar">
              {/* BHK Pills for residential */}
              {activeMode !== 'commercial' && activeMode !== 'plots' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
                    BHK:
                  </span>
                  <div className="gd-bhk-pills">
                    {[1, 2, 3, 4].map((bhk) => (
                      <button
                        key={bhk}
                        type="button"
                        className={`gd-bhk-pill ${selectedBhk.includes(bhk) ? 'active' : ''}`}
                        onClick={() => toggleBhk(bhk)}
                        aria-pressed={selectedBhk.includes(bhk)}
                      >
                        {bhk === 4 ? '4+ BHK' : `${bhk} BHK`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Filter Checkboxes */}
              <div className="gd-quick-toggles">
                <label className="gd-toggle-label">
                  <input
                    type="checkbox"
                    checked={readyToMove}
                    onChange={(e) => setReadyToMove(e.target.checked)}
                  />
                  <span>Ready to Move</span>
                </label>
                <label className="gd-toggle-label">
                  <input
                    type="checkbox"
                    checked={ownerListed}
                    onChange={(e) => setOwnerListed(e.target.checked)}
                  />
                  <span>Owner Listed Only</span>
                </label>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
