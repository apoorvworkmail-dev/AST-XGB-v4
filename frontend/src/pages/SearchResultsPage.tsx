import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Search,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { searchListings, ListingsAdapterResponse } from '../services/listingsAdapter';
import { CompactSearchSummary } from '../components/search/CompactSearchSummary';
import { SearchSortBar } from '../components/search/SearchSortBar';
import { SearchFiltersSidebar } from '../components/search/SearchFiltersSidebar';
import { SearchResultCard } from '../components/search/SearchResultCard';
import { InteractivePropertyMap } from '../components/search/InteractivePropertyMap';
import { ComparisonFloatingTray } from '../components/search/ComparisonFloatingTray';
import { PaginationBar } from '../components/search/PaginationBar';
import {
  PropertyListing,
  PropertySearchQuery,
  TransactionMode,
  SortOption,
  FurnishingStatus,
  PossessionStatus,
  SellerType,
} from '../types/property';

interface SearchResultsPageProps {
  defaultMode?: TransactionMode;
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  defaultMode,
  savedIds,
  onToggleSave,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active View ('list' or 'map') synced to URL param
  const activeView = (searchParams.get('view') as 'list' | 'map') || 'list';

  // State
  const [resultsData, setResultsData] = useState<ListingsAdapterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comparison State
  const [comparedProperties, setComparedProperties] = useState<PropertyListing[]>([]);

  // Parse structured URL Query to typed PropertySearchQuery
  const currentQuery: PropertySearchQuery = useMemo(() => {
    const mode = (searchParams.get('mode') as TransactionMode) || defaultMode || 'buy';
    const city = searchParams.get('city') || undefined;
    const locality = searchParams.get('locality') || undefined;
    const propertyType = searchParams.get('type') || undefined;
    const minPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined;
    const maxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined;
    const minArea = searchParams.get('min_area') ? Number(searchParams.get('min_area')) : undefined;
    const maxArea = searchParams.get('max_area') ? Number(searchParams.get('max_area')) : undefined;
    const maxAgeYears = searchParams.get('age') ? Number(searchParams.get('age')) : undefined;

    const bhk = searchParams.get('bhk')
      ? searchParams.get('bhk')!.split(',').map(Number)
      : undefined;

    const bathrooms = searchParams.get('baths')
      ? searchParams.get('baths')!.split(',').map(Number)
      : undefined;

    const furnishing = searchParams.get('furnishing')
      ? (searchParams.get('furnishing')!.split(',') as FurnishingStatus[])
      : undefined;

    const possessionStatus = searchParams.get('possession')
      ? (searchParams.get('possession')!.split(',') as PossessionStatus[])
      : undefined;

    const sellerType = searchParams.get('seller')
      ? (searchParams.get('seller')!.split(',') as SellerType[])
      : undefined;

    const commutePriority = (searchParams.get('commute') as any) || undefined;
    const sortBy = (searchParams.get('sort') as SortOption) || 'relevance';
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

    return {
      mode,
      city,
      locality,
      propertyType,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      maxAgeYears,
      bhk,
      bathrooms,
      furnishing,
      possessionStatus,
      sellerType,
      commutePriority,
      sortBy,
      page,
      pageSize: 6,
    };
  }, [searchParams, defaultMode]);

  // Execute query on searchParams change
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    searchListings(currentQuery)
      .then((data) => {
        if (!isCancelled) {
          setResultsData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Failed to retrieve listings');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentQuery]);

  // Update query state into URLSearchParams
  const handleUpdateQuery = (updates: Partial<PropertySearchQuery>) => {
    const next = new URLSearchParams(searchParams);

    const merged = { ...currentQuery, ...updates };

    // Mode
    if (merged.mode) next.set('mode', merged.mode);
    else next.delete('mode');

    // City
    if (merged.city && merged.city !== 'All Cities') next.set('city', merged.city);
    else next.delete('city');

    // Locality
    if (merged.locality) next.set('locality', merged.locality);
    else next.delete('locality');

    // Property Type
    if (merged.propertyType && merged.propertyType !== 'All Types') next.set('type', merged.propertyType);
    else next.delete('type');

    // Budget
    if (merged.minPrice !== undefined && merged.minPrice > 0) next.set('min_price', merged.minPrice.toString());
    else next.delete('min_price');
    if (merged.maxPrice !== undefined && merged.maxPrice > 0) next.set('max_price', merged.maxPrice.toString());
    else next.delete('max_price');

    // Area
    if (merged.minArea !== undefined && merged.minArea > 0) next.set('min_area', merged.minArea.toString());
    else next.delete('min_area');
    if (merged.maxArea !== undefined && merged.maxArea > 0) next.set('max_area', merged.maxArea.toString());
    else next.delete('max_area');

    // Age
    if (merged.maxAgeYears !== undefined && merged.maxAgeYears > 0) next.set('age', merged.maxAgeYears.toString());
    else next.delete('age');

    // Arrays (bhk, baths, furnishing, possession, seller)
    if (merged.bhk && merged.bhk.length > 0) next.set('bhk', merged.bhk.join(','));
    else next.delete('bhk');

    if (merged.bathrooms && merged.bathrooms.length > 0) next.set('baths', merged.bathrooms.join(','));
    else next.delete('baths');

    if (merged.furnishing && merged.furnishing.length > 0) next.set('furnishing', merged.furnishing.join(','));
    else next.delete('furnishing');

    if (merged.possessionStatus && merged.possessionStatus.length > 0) next.set('possession', merged.possessionStatus.join(','));
    else next.delete('possession');

    if (merged.sellerType && merged.sellerType.length > 0) next.set('seller', merged.sellerType.join(','));
    else next.delete('seller');

    // Commute Priority (Smart Search)
    if (merged.commutePriority && merged.commutePriority !== 'none') next.set('commute', merged.commutePriority);
    else next.delete('commute');

    // Sort
    if (merged.sortBy && merged.sortBy !== 'relevance') next.set('sort', merged.sortBy);
    else next.delete('sort');

    // Page
    if (merged.page && merged.page > 1) next.set('page', merged.page.toString());
    else next.delete('page');

    setSearchParams(next);
  };

  const handleRemoveSingleFilter = (key: keyof PropertySearchQuery, val?: any) => {
    switch (key) {
      case 'city':
        handleUpdateQuery({ city: undefined, locality: undefined, page: 1 });
        break;
      case 'locality':
        handleUpdateQuery({ locality: undefined, page: 1 });
        break;
      case 'commutePriority':
        handleUpdateQuery({ commutePriority: undefined, page: 1 });
        break;
      case 'propertyType':
        handleUpdateQuery({ propertyType: undefined, page: 1 });
        break;
      case 'bhk':
        handleUpdateQuery({ bhk: undefined, page: 1 });
        break;
      case 'bathrooms':
        handleUpdateQuery({ bathrooms: undefined, page: 1 });
        break;
      case 'maxPrice':
        handleUpdateQuery({ minPrice: undefined, maxPrice: undefined, page: 1 });
        break;
      case 'maxArea':
        handleUpdateQuery({ minArea: undefined, maxArea: undefined, page: 1 });
        break;
      case 'furnishing':
        handleUpdateQuery({ furnishing: undefined, page: 1 });
        break;
      case 'possessionStatus':
        handleUpdateQuery({ possessionStatus: undefined, page: 1 });
        break;
      case 'maxAgeYears':
        handleUpdateQuery({ maxAgeYears: undefined, page: 1 });
        break;
      case 'sellerType':
        handleUpdateQuery({ sellerType: undefined, page: 1 });
        break;
      case 'mode':
        handleUpdateQuery({ mode: 'buy', page: 1 });
        break;
      default:
        break;
    }
  };

  const handleClearAll = () => {
    const next = new URLSearchParams();
    if (defaultMode) next.set('mode', defaultMode);
    setSearchParams(next);
  };

  const handleToggleCompare = (property: PropertyListing) => {
    setComparedProperties((prev) => {
      if (prev.some((p) => p.id === property.id)) {
        return prev.filter((p) => p.id !== property.id);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 properties at a time.');
        return prev;
      }
      return [...prev, property];
    });
  };

  const handleViewChange = (view: 'list' | 'map') => {
    const next = new URLSearchParams(searchParams);
    if (view === 'map') next.set('view', 'map');
    else next.delete('view');
    setSearchParams(next);
  };

  const totalCount = resultsData ? resultsData.total : 0;
  const items = resultsData ? resultsData.items : [];
  const availableLocs = resultsData ? resultsData.availableLocalities : [];

  return (
    <div className="gd-consumer-app" style={{ minHeight: 'calc(100vh - 68px)' }}>
      {/* Top Breadcrumb Navigation */}
      <div style={{ backgroundColor: 'var(--gd-warm-card)', borderBottom: '1px solid var(--gd-warm-border)', padding: '16px 0' }}>
        <div className="gd-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={13} />
            <span style={{ textTransform: 'capitalize', color: 'var(--gd-text-charcoal)', fontWeight: 600 }}>
              {currentQuery.mode || 'Buy'} Properties
            </span>
            {currentQuery.city && (
              <>
                <ChevronRight size={13} />
                <span style={{ color: 'var(--gd-text-charcoal)', fontWeight: 600 }}>{currentQuery.city}</span>
              </>
            )}
            {currentQuery.locality && (
              <>
                <ChevronRight size={13} />
                <span style={{ color: 'var(--gd-terra-600)', fontWeight: 700 }}>{currentQuery.locality}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Results Layout Container */}
      <div className="gd-container" style={{ padding: '28px 20px 80px 20px', flex: 1 }}>
        <div className="gd-search-layout">
          {/* Left Column: Stateful Filters Sidebar */}
          <SearchFiltersSidebar
            query={currentQuery}
            onUpdateQuery={handleUpdateQuery}
            onReset={handleClearAll}
            availableLocalities={availableLocs}
          />

          {/* Right Column: Active Summary, Controls, Results & Map */}
          <main id="search-results-main" tabIndex={-1}>
            {/* 1. Compact Search Summary Bar */}
            <CompactSearchSummary
              query={currentQuery}
              totalCount={totalCount}
              onRemoveFilter={handleRemoveSingleFilter}
              onClearAll={handleClearAll}
            />

            {/* 2. Sort Controls & View Toggle */}
            <SearchSortBar
              totalCount={totalCount}
              currentSort={currentQuery.sortBy || 'relevance'}
              onSortChange={(sort) => handleUpdateQuery({ sortBy: sort, page: 1 })}
              activeView={activeView}
              onViewChange={handleViewChange}
            />

            {/* 3. Conditional View: Map View vs List View */}
            {activeView === 'map' ? (
              <InteractivePropertyMap
                properties={items}
                selectedCity={currentQuery.city || 'Bengaluru'}
                onSwitchToList={() => handleViewChange('list')}
              />
            ) : (
              <>
                {/* Loading State Skeletons */}
                {loading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        style={{
                          height: '240px',
                          borderRadius: 'var(--gd-radius-lg)',
                          backgroundColor: 'var(--gd-warm-card)',
                          border: '1px solid var(--gd-warm-border)',
                          opacity: 0.6,
                          animation: 'pulse 1.5s infinite',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Error State */}
                {!loading && error && (
                  <div
                    style={{
                      backgroundColor: 'var(--gd-warm-card)',
                      border: '1px solid #fca5a5',
                      borderRadius: 'var(--gd-radius-lg)',
                      padding: '40px 24px',
                      textAlign: 'center',
                    }}
                  >
                    <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#991b1b' }}>
                      Error Loading Property Results
                    </h3>
                    <p style={{ color: 'var(--gd-text-slate)', fontSize: '14px', marginBottom: '18px' }}>
                      {error}
                    </p>
                    <button
                      type="button"
                      className="gd-btn-search"
                      onClick={() => handleUpdateQuery({})}
                      style={{ display: 'inline-flex' }}
                    >
                      Retry Query
                    </button>
                  </div>
                )}

                {/* Listing Results Cards */}
                {!loading && !error && items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {items.map((prop) => (
                      <SearchResultCard
                        key={prop.id}
                        property={prop}
                        isSaved={savedIds.includes(prop.id)}
                        onToggleSave={onToggleSave}
                        isCompared={comparedProperties.some((p) => p.id === prop.id)}
                        onToggleCompare={handleToggleCompare}
                        matchResult={resultsData?.smartMatches?.[prop.id]}
                      />
                    ))}
                  </div>
                )}

                {/* No Results Empty State */}
                {!loading && !error && items.length === 0 && (
                  <div
                    style={{
                      backgroundColor: 'var(--gd-warm-card)',
                      border: '1px solid var(--gd-warm-border)',
                      borderRadius: 'var(--gd-radius-lg)',
                      padding: '60px 24px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--gd-terra-50)',
                        color: 'var(--gd-terra-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                      }}
                    >
                      <Search size={26} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-charcoal)' }}>
                      No Benchmark Records Match Your Filter Criteria
                    </h3>
                    <p style={{ color: 'var(--gd-text-slate)', fontSize: '14.5px', maxWidth: '460px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                      We couldn&apos;t find any evaluation properties matching this exact combination of filters. Try broadening your budget range, resetting BHK selections, or selecting &ldquo;All 7 Metros&rdquo;.
                    </p>
                    <button
                      type="button"
                      className="gd-btn-search"
                      onClick={handleClearAll}
                      style={{ display: 'inline-flex' }}
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                {/* 4. Pagination Controls */}
                {!loading && resultsData && (
                  <PaginationBar
                    currentPage={resultsData.page}
                    totalPages={resultsData.totalPages}
                    totalItems={resultsData.total}
                    pageSize={resultsData.pageSize}
                    onPageChange={(nextPage) => handleUpdateQuery({ page: nextPage })}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Floating Sticky Comparison Tray */}
      <ComparisonFloatingTray
        comparedProperties={comparedProperties}
        onRemoveFromCompare={(id) => setComparedProperties((prev) => prev.filter((p) => p.id !== id))}
        onClearCompare={() => setComparedProperties([])}
      />
    </div>
  );
};
