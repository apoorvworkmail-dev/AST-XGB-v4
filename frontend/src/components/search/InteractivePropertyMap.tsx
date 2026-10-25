import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import {
  MapPin,
  X,
  ExternalLink,
  Navigation,
  List,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { PropertyListing } from '../../types/property';
import { isValidCoordinate } from '../../services/smartSearchService';

interface InteractivePropertyMapProps {
  properties: PropertyListing[];
  selectedCity: string;
  onSwitchToList?: () => void;
  onSelectProperty?: (property: PropertyListing) => void;
}

export const InteractivePropertyMap: React.FC<InteractivePropertyMapProps> = ({
  properties,
  selectedCity,
  onSwitchToList,
  onSelectProperty,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeProperty, setActiveProperty] = useState<PropertyListing | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Configuration from documented environment variables (safe, no secrets exposed)
  const tileUrl =
    (import.meta.env.VITE_MAP_TILE_URL as string) ||
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const tileAttribution =
    (import.meta.env.VITE_MAP_ATTRIBUTION as string) ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  const maxZoom = Number(import.meta.env.VITE_MAP_MAX_ZOOM) || 19;

  // Filter properties with strictly valid geographic coordinates
  const validProperties = useMemo(() => {
    return properties.filter((p) =>
      isValidCoordinate(p.location.latitude, p.location.longitude)
    );
  }, [properties]);

  // City Center fallback coordinates
  const cityDefaultCoords: Record<string, [number, number]> = {
    Bengaluru: [12.9716, 77.5946],
    Mumbai: [19.076, 72.8777],
    Gurugram: [28.4595, 77.0266],
    Hyderabad: [17.385, 78.4867],
    Pune: [18.5204, 73.8567],
    Chennai: [13.0827, 80.2707],
    Kolkata: [22.5726, 88.3639],
  };

  const defaultCenter = cityDefaultCoords[selectedCity] || [12.9716, 77.5946];

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Prevent double initialization
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          zoomControl: false, // We provide modern styled custom zoom controls
        });

        // Add raster tile layer
        const tileLayer = L.tileLayer(tileUrl, {
          attribution: tileAttribution,
          maxZoom,
          subdomains: 'abcd',
        });

        tileLayer.on('tileerror', () => {
          // If external tile server experiences network drops, notify without crashing
          setTilesLoaded(true);
        });

        tileLayer.on('load', () => {
          setTilesLoaded(true);
        });

        tileLayer.addTo(map);

        // Group layer for dynamic property markers
        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;
      }
    } catch (err: any) {
      console.warn('Leaflet map initialization notice:', err);
      setMapError('Interactive map canvas could not be loaded. Displaying list-only fallback.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Markers and Bounds whenever valid properties or active property change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    try {
      markersGroup.clearLayers();

      if (validProperties.length === 0) {
        map.setView(defaultCenter, 11);
        return;
      }

      const latLngs: L.LatLngExpression[] = [];

      validProperties.forEach((prop) => {
        const lat = prop.location.latitude;
        const lng = prop.location.longitude;
        const isSelected = activeProperty?.id === prop.id;

        latLngs.push([lat, lng]);

        // Custom HTML marker badge matching GharDhundo design system
        const badgeHtml = `
          <div class="gd-map-marker-pin ${isSelected ? 'is-selected' : ''}" style="
            background-color: ${isSelected ? '#c2410c' : '#0f172a'};
            color: #ffffff;
            border: 2px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)'};
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 11.5px;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
            box-shadow: ${isSelected ? '0 0 16px rgba(194,65,12,0.9)' : '0 4px 12px rgba(0,0,0,0.35)'};
            cursor: pointer;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transform: translate(-50%, -100%);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${isSelected ? '#ffffff' : '#38bdf8'}"></span>
            <span>${prop.priceFormatted}</span>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'gd-custom-map-icon',
          html: badgeHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        marker.on('click', () => {
          setActiveProperty(prop);
          if (onSelectProperty) onSelectProperty(prop);
          map.panTo([lat, lng], { animate: true, duration: 0.5 });
        });

        markersGroup.addLayer(marker);
      });

      // Synchronize map bounds to encapsulate all visible filtered properties
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
        });
      }
    } catch (err) {
      console.warn('Marker synchronization notice:', err);
    }
  }, [validProperties, activeProperty]);

  // Zoom Helpers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetBounds = () => {
    if (!mapInstanceRef.current || validProperties.length === 0) return;
    const latLngs = validProperties.map((p) => [p.location.latitude, p.location.longitude] as [number, number]);
    const bounds = L.latLngBounds(latLngs);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  };

  // If map error occurred or provider failed, render graceful list-only fallback
  if (mapError) {
    return (
      <div
        style={{
          backgroundColor: 'var(--gd-warm-card)',
          border: '1px solid var(--gd-warm-border)',
          borderRadius: 'var(--gd-radius-xl)',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: 'var(--gd-shadow-sm)',
        }}
      >
        <AlertTriangle size={36} color="var(--gd-terra-600)" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-charcoal)' }}>
          Map View Graceful Fallback Active
        </h3>
        <p style={{ color: 'var(--gd-text-slate)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
          {mapError} All {properties.length} active listings remain fully accessible in list view.
        </p>
        {onSwitchToList && (
          <button
            type="button"
            className="gd-btn-search"
            onClick={onSwitchToList}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <List size={16} />
            <span>Switch to Structured List View</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderRadius: 'var(--gd-radius-xl)',
        height: '640px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--gd-warm-border)',
        boxShadow: 'var(--gd-shadow-lg)',
      }}
      aria-label="Geospatial Discovery Map"
    >
      {/* Actual Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* Top Map Control Bar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.90)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--gd-radius-md)',
            padding: '8px 14px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Navigation size={14} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 700 }}>
            {selectedCity} Geo-Plotted Matrix
          </span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            {validProperties.length} Geocoded
          </span>
          {properties.length > validProperties.length && (
            <span
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              ({properties.length - validProperties.length} non-coordinate listings omitted from map)
            </span>
          )}
        </div>

        {onSwitchToList && (
          <button
            type="button"
            onClick={onSwitchToList}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.90)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--gd-radius-md)',
              padding: '8px 14px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              pointerEvents: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <List size={14} />
            <span>Switch to List</span>
          </button>
        )}
      </div>

      {/* Floating Zoom & Bounds Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.90)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          }}
          aria-label="Zoom in"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.90)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          }}
          aria-label="Zoom out"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          onClick={handleResetBounds}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.90)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          }}
          aria-label="Fit all properties into view"
          title="Fit All Properties"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Selected Property Popup Flyout Card */}
      {activeProperty && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            maxWidth: '340px',
            zIndex: 30,
            backgroundColor: 'var(--gd-warm-card)',
            borderRadius: 'var(--gd-radius-lg)',
            border: '1px solid var(--gd-warm-border)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            overflow: 'hidden',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          <div style={{ position: 'relative', height: '145px' }}>
            <img
              src={
                activeProperty.images[0] ||
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'
              }
              alt={activeProperty.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => setActiveProperty(null)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.65)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Close preview"
            >
              <X size={14} />
            </button>
            <span
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#ffffff',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              {activeProperty.specs.possessionStatus}
            </span>
          </div>

          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
              <div
                style={{
                  fontSize: '19px',
                  fontWeight: 800,
                  color: 'var(--gd-text-charcoal)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {activeProperty.priceFormatted}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                ₹{activeProperty.pricePerSqft.toLocaleString('en-IN')}/sq.ft
              </div>
            </div>

            <h4
              style={{
                fontSize: '14px',
                fontWeight: 700,
                margin: '2px 0 6px 0',
                color: 'var(--gd-text-charcoal)',
                lineHeight: 1.3,
              }}
            >
              {activeProperty.title}
            </h4>

            <div
              style={{
                fontSize: '12.5px',
                color: 'var(--gd-text-slate)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MapPin size={13} color="var(--gd-terra-500)" />
              <span>
                {activeProperty.location.locality}, {activeProperty.location.city}
              </span>
            </div>

            <Link
              to={`/property/${activeProperty.slug}`}
              className="gd-btn-search"
              style={{
                width: '100%',
                height: '34px',
                fontSize: '13px',
                textDecoration: 'none',
                borderRadius: 'var(--gd-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>View Property Details</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
