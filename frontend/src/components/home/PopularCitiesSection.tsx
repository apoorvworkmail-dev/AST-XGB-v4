import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';

export const PopularCitiesSection: React.FC = () => {
  const cities = [
    { name: 'Bengaluru', count: '1,450+ Properties', avgRate: '₹ 7,172 / sqft', locality: 'Whitefield, Koramangala, Indiranagar' },
    { name: 'Mumbai', count: '2,100+ Properties', avgRate: '₹ 14,828 / sqft', locality: 'Andheri, Bandra, Powai' },
    { name: 'Delhi', count: '1,820+ Properties', avgRate: '₹ 10,207 / sqft', locality: 'Dwarka, Vasant Kunj, Rohini' },
    { name: 'Hyderabad', count: '1,120+ Properties', avgRate: '₹ 6,759 / sqft', locality: 'Gachibowli, Hitec City, Jubilee Hills' },
    { name: 'Pune', count: '940+ Properties', avgRate: '₹ 6,120 / sqft', locality: 'Wakad, Baner, Hinjewadi' },
    { name: 'Chennai', count: '810+ Properties', avgRate: '₹ 7,450 / sqft', locality: 'Adayar, OMR, Velachery' },
    { name: 'Kolkata', count: '670+ Properties', avgRate: '₹ 5,945 / sqft', locality: 'New Town, Salt Lake, Alipore' },
  ];

  return (
    <section className="gd-section" aria-labelledby="popular-cities-heading">
      <div className="gd-container">
        <div className="gd-section-header">
          <div className="gd-section-title">
            <h3 id="popular-cities-heading">Explore Real Estate by Metro City</h3>
            <p>Direct access to thousands of listings and AST-XGB market insights across India&apos;s leading property hubs.</p>
          </div>
          <Link to="/cities" className="gd-section-link">
            <span>Browse All Indian Metros</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="gd-cities-grid">
          {cities.map((city) => (
            <Link
              key={city.name}
              to={`/city/${encodeURIComponent(city.name)}`}
              className="gd-city-card"
            >
              <div className="gd-city-icon-wrapper">
                <Building2 size={24} />
              </div>
              <h4>{city.name}</h4>
              <span className="prop-count">{city.count}</span>
              <span className="gd-city-rate">{city.avgRate}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
