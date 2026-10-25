import React from 'react';
import { ArrowUpDown, LayoutGrid, Map, SlidersHorizontal } from 'lucide-react';
import { SortOption } from '../../types/property';

interface SearchSortBarProps {
  totalCount: number;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeView: 'list' | 'map';
  onViewChange: (view: 'list' | 'map') => void;
  onToggleMobileFilters?: () => void;
}

export const SearchSortBar: React.FC<SearchSortBarProps> = ({
  totalCount,
  currentSort,
  onSortChange,
  activeView,
  onViewChange,
  onToggleMobileFilters,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      {/* Mobile Filters Trigger */}
      {onToggleMobileFilters && (
        <button
          type="button"
          className="gd-bhk-pill"
          onClick={onToggleMobileFilters}
          style={{ display: 'none', alignItems: 'center', gap: '6px' }}
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
        </button>
      )}

      {/* Sort Select */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowUpDown size={15} color="var(--gd-text-muted)" />
        <label htmlFor="search-sort" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gd-text-slate)' }}>
          Sort by:
        </label>
        <select
          id="search-sort"
          className="gd-search-select"
          style={{ width: 'auto', padding: '6px 14px', fontSize: '13px', height: '38px', borderRadius: 'var(--gd-radius-md)' }}
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          <option value="relevance">Relevance (Default)</option>
          <option value="smart_match">Smart Match (Multi-Attribute Fit)</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="area_desc">Built-up Area: High to Low</option>
          <option value="newest">Recently Listed</option>
        </select>
      </div>

      {/* Map / List View Toggle */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--gd-warm-card)',
          border: '1px solid var(--gd-warm-border)',
          borderRadius: 'var(--gd-radius-md)',
          padding: '3px',
          gap: '4px',
        }}
        role="group"
        aria-label="View toggle"
      >
        <button
          type="button"
          onClick={() => onViewChange('list')}
          className={`gd-bhk-pill ${activeView === 'list' ? 'active' : ''}`}
          style={{
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          aria-pressed={activeView === 'list'}
        >
          <LayoutGrid size={14} />
          <span>List View</span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange('map')}
          className={`gd-bhk-pill ${activeView === 'map' ? 'active' : ''}`}
          style={{
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          aria-pressed={activeView === 'map'}
        >
          <Map size={14} />
          <span>Map View</span>
        </button>
      </div>
    </div>
  );
};
