import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { fetchMarketState } from '../../services/marketService';
import { CityMarketData, MarketStateResponse } from '../../types/valuation';

export const MarketPulseTicker: React.FC = () => {
  const navigate = useNavigate();
  const [marketState, setMarketState] = useState<MarketStateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketState().then((data) => {
      setMarketState(data);
      setLoading(false);
    });
  }, []);

  const defaultCities: CityMarketData[] = [
    { city: 'Bengaluru', locality: 'Whitefield', avgPriceInr: 10400000, avgPriceFormatted: '₹ 1.04 Cr', pricePerSqft: 7172, nhbHpi: 154.2, yoyGrowthPct: 5.8, aqi: 92, regime: 'Growth' },
    { city: 'Mumbai', locality: 'Andheri East', avgPriceInr: 21500000, avgPriceFormatted: '₹ 2.15 Cr', pricePerSqft: 14828, nhbHpi: 162.0, yoyGrowthPct: 6.1, aqi: 135, regime: 'Growth' },
    { city: 'Delhi', locality: 'Dwarka', avgPriceInr: 14800000, avgPriceFormatted: '₹ 1.48 Cr', pricePerSqft: 10207, nhbHpi: 148.9, yoyGrowthPct: 4.2, aqi: 198, regime: 'Stable' },
    { city: 'Hyderabad', locality: 'Gachibowli', avgPriceInr: 9800000, avgPriceFormatted: '₹ 98.00 L', pricePerSqft: 6759, nhbHpi: 168.4, yoyGrowthPct: 7.4, aqi: 88, regime: 'Growth' },
    { city: 'Pune', locality: 'Wakad', avgPriceInr: 8200000, avgPriceFormatted: '₹ 82.00 L', pricePerSqft: 6120, nhbHpi: 142.1, yoyGrowthPct: 4.9, aqi: 110, regime: 'Stable' },
    { city: 'Chennai', locality: 'Adayar', avgPriceInr: 11200000, avgPriceFormatted: '₹ 1.12 Cr', pricePerSqft: 7450, nhbHpi: 139.8, yoyGrowthPct: 3.8, aqi: 75, regime: 'Stable' },
    { city: 'Kolkata', locality: 'New Town', avgPriceInr: 8800000, avgPriceFormatted: '₹ 88.00 L', pricePerSqft: 5945, nhbHpi: 134.5, yoyGrowthPct: 3.2, aqi: 125, regime: 'Stable' },
  ];

  const displayCities = marketState?.city_prices && marketState.city_prices.length > 0
    ? marketState.city_prices
    : defaultCities;

  return (
    <div className="gd-market-pulse-strip" aria-label="7 Metro Real Estate Market Ticker">
      <div className="gd-container">
        <div className="gd-pulse-container">
          <div className="gd-pulse-label">
            <Activity size={15} />
            <span>Metro Pulse</span>
          </div>

          {displayCities.map((item: any) => {
            const rate = item.price_per_sqft ?? item.pricePerSqft ?? 7000;
            const growth = item.yoy_growth_pct ?? item.yoyGrowthPct ?? 5.0;
            const regime = item.regime || 'Growth';
            const formattedRate = Math.round(rate).toLocaleString();

            return (
              <div
                key={item.city}
                className="gd-pulse-item"
                onClick={() => navigate(`/search?city=${encodeURIComponent(item.city)}`)}
                title={`View ${item.city} properties (Avg ₹${formattedRate}/sqft)`}
              >
                <span className="gd-pulse-city">{item.city}</span>
                <span className="gd-pulse-rate">₹{formattedRate}/sqft</span>
                <span className={`gd-pulse-badge ${regime.toLowerCase() === 'growth' ? 'growth' : 'stable'}`}>
                  <TrendingUp size={11} />
                  +{growth}%
                </span>
              </div>
            );
          })}

          <div
            className="gd-pulse-item"
            style={{ marginLeft: 'auto', color: 'var(--gd-ai-indigo)', fontWeight: 700 }}
            onClick={() => navigate('/market-insights')}
          >
            <Sparkles size={14} />
            <span>Locality & Market View →</span>
          </div>
        </div>
      </div>
    </div>
  );
};
