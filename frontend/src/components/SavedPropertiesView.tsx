import React, { useState, useEffect } from 'react';
import { Layers, Bookmark, Trash2, Download, Plus, CheckCircle, MapPin, Building, Maximize } from 'lucide-react';

interface SavedProperty {
  id: string;
  city: string;
  locality: string;
  propertyType: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: string;
  ppsf: number;
  dateSaved: string;
}

interface SavedPropertiesViewProps {
  currentProperty: {
    city: string;
    locality: string;
    propertyType: string;
    area: number;
    bedrooms: number;
    bathrooms: number;
    price: string;
    ppsf: number;
  };
}

export const SavedPropertiesView: React.FC<SavedPropertiesViewProps> = ({ currentProperty }) => {
  const [savedList, setSavedList] = useState<SavedProperty[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const loaded = localStorage.getItem('ast_xgb_saved_properties');
    if (loaded) {
      try {
        setSavedList(JSON.parse(loaded));
      } catch (e) {
        setSavedList([]);
      }
    } else {
      // Default sample portfolio
      const defaults: SavedProperty[] = [
        {
          id: 'prop-1',
          city: 'Bengaluru',
          locality: 'Whitefield',
          propertyType: 'Apartment',
          area: 1450,
          bedrooms: 3,
          bathrooms: 2,
          price: '₹ 1.04 Cr',
          ppsf: 7187,
          dateSaved: '2026-08-31'
        },
        {
          id: 'prop-2',
          city: 'Mumbai',
          locality: 'Bandra West',
          propertyType: 'Apartment',
          area: 1200,
          bedrooms: 2,
          bathrooms: 2,
          price: '₹ 3.85 Cr',
          ppsf: 32083,
          dateSaved: '2026-08-30'
        }
      ];
      setSavedList(defaults);
      localStorage.setItem('ast_xgb_saved_properties', JSON.stringify(defaults));
    }
  }, []);

  const saveCurrentProperty = () => {
    const newProp: SavedProperty = {
      id: `prop-${Date.now()}`,
      ...currentProperty,
      dateSaved: new Date().toISOString().split('T')[0]
    };
    const updated = [newProp, ...savedList];
    setSavedList(updated);
    localStorage.setItem('ast_xgb_saved_properties', JSON.stringify(updated));
    setNotification('Current property saved to portfolio!');
    setTimeout(() => setNotification(null), 3000);
  };

  const deleteProperty = (id: string) => {
    const updated = savedList.filter(p => p.id !== id);
    setSavedList(updated);
    localStorage.setItem('ast_xgb_saved_properties', JSON.stringify(updated));
  };

  const exportCSV = () => {
    const headers = ['City', 'Locality', 'Type', 'Area (sqft)', 'BHK', 'Bathrooms', 'Price', 'Price/SqFt', 'Date Saved'];
    const rows = savedList.map(p => [p.city, p.locality, p.propertyType, p.area, p.bedrooms, p.bathrooms, p.price, p.ppsf, p.dateSaved]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ast_xgb_saved_properties.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(236, 72, 153, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Layers size={22} color="var(--primary-indigo)" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Saved Properties & Valuation Portfolio
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Bookmark properties, compare side-by-side metrics, and export data.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary-sm" onClick={saveCurrentProperty} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            Bookmark Current Property
          </button>
          <button className="btn-secondary-sm" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ background: 'var(--bg-green-light)', border: '1px solid var(--success-green)', color: 'var(--success-green)', padding: '12px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
          <CheckCircle size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <Bookmark size={18} color="var(--primary-indigo)" />
            <h3>Portfolio Comparison Matrix ({savedList.length} Saved)</h3>
          </div>
        </div>

        {savedList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No saved properties in your portfolio yet.</p>
            <button className="btn-primary-sm" onClick={saveCurrentProperty}>
              Save Current Property Now
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Location</th>
                  <th style={{ padding: '12px 16px' }}>Property Type</th>
                  <th style={{ padding: '12px 16px' }}>Area (sq ft)</th>
                  <th style={{ padding: '12px 16px' }}>BHK / Baths</th>
                  <th style={{ padding: '12px 16px' }}>Valuation</th>
                  <th style={{ padding: '12px 16px' }}>Rate / Sq Ft</th>
                  <th style={{ padding: '12px 16px' }}>Date Saved</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {savedList.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {p.city}, {p.locality}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{p.propertyType}</td>
                    <td style={{ padding: '14px 16px' }}>{p.area} sq ft</td>
                    <td style={{ padding: '14px 16px' }}>{p.bedrooms} BHK / {p.bathrooms} Bath</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--success-green)' }}>{p.price}</td>
                    <td style={{ padding: '14px 16px' }}>₹ {p.ppsf.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{p.dateSaved}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button onClick={() => deleteProperty(p.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-red)', cursor: 'pointer', padding: '6px' }} title="Delete Property">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
