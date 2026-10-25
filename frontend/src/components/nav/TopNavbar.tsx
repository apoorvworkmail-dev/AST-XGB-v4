import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  Calculator,
  Scale,
  TrendingUp,
  PlusCircle,
  Building2,
  Sliders,
  ShieldCheck,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopNavbarProps {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  savedCount: number;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ theme, setTheme, savedCount }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="gd-navbar" role="banner">
        <div className="gd-container">
          <div className="gd-navbar-inner">
            {/* Brand Logo */}
            <Link to="/" className="gd-brand" aria-label="GharDhundo Home">
              <div className="gd-brand-icon">
                <span>Gh</span>
              </div>
              <div className="gd-brand-text">
                <h1>GharDhundo</h1>
                <span>AST-XGB REAL ESTATE</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="gd-nav-links" aria-label="Primary Navigation">
              <Link to="/buy" className={`gd-nav-item ${isActive('/buy') ? 'active' : ''}`}>
                Buy
              </Link>
              <Link to="/rent" className={`gd-nav-item ${isActive('/rent') ? 'active' : ''}`}>
                Rent
              </Link>
              <Link to="/pg" className={`gd-nav-item ${isActive('/pg') ? 'active' : ''}`}>
                PG & Co-living
              </Link>
              <Link to="/plots" className={`gd-nav-item ${isActive('/plots') ? 'active' : ''}`}>
                Plots
              </Link>
              <Link to="/commercial" className={`gd-nav-item ${isActive('/commercial') ? 'active' : ''}`}>
                Commercial
              </Link>
              <Link to="/new-projects" className={`gd-nav-item ${isActive('/new-projects') ? 'active' : ''}`}>
                New Projects
              </Link>

              {/* Tools & Calculators Dropdown */}
              <div
                className="gd-field-group"
                style={{ position: 'relative' }}
                onMouseEnter={() => setToolsOpen(true)}
                onMouseLeave={() => setToolsOpen(false)}
              >
                <button
                  type="button"
                  className={`gd-nav-item ${isActive('/tools') ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none' }}
                  onClick={() => setToolsOpen(!toolsOpen)}
                  aria-expanded={toolsOpen}
                  aria-haspopup="true"
                >
                  <span>Tools & Advice</span>
                  <ChevronDown size={14} />
                </button>

                {toolsOpen && (
                  <div
                    className="gd-autocomplete-menu"
                    style={{
                      width: '240px',
                      right: 0,
                      left: 'auto',
                      padding: '8px',
                      boxShadow: 'var(--gd-shadow-lg)',
                    }}
                  >
                    <Link
                      to="/tools/emi-calculator"
                      className="gd-autocomplete-item"
                      onClick={() => setToolsOpen(false)}
                      style={{ borderRadius: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calculator size={16} color="var(--gd-terra-500)" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px' }}>EMI Calculator</strong>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>Monthly loan EMI & schedule</span>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/tools/eligibility"
                      className="gd-autocomplete-item"
                      onClick={() => setToolsOpen(false)}
                      style={{ borderRadius: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calculator size={16} color="#8b5cf6" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px' }}>Loan Eligibility</strong>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>FOIR-based max loan estimator</span>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/tools/buy-vs-rent"
                      className="gd-autocomplete-item"
                      onClick={() => setToolsOpen(false)}
                      style={{ borderRadius: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calculator size={16} color="#10b981" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px' }}>Buy vs. Rent Simulator</strong>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>Long-term net worth model</span>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/tools/roi-calculator"
                      className="gd-autocomplete-item"
                      onClick={() => setToolsOpen(false)}
                      style={{ borderRadius: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calculator size={16} color="#f59e0b" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px' }}>Investment ROI &amp; Yield</strong>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>Net yield and capitalization rate</span>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/tools/compare"
                      className="gd-autocomplete-item"
                      onClick={() => setToolsOpen(false)}
                      style={{ borderRadius: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Scale size={16} color="var(--gd-terra-500)" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px' }}>Compare Properties</strong>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>Side-by-side feature comparison</span>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/market-insights"
                      className="gd-autocomplete-item"
                      onClick={() => setToolsOpen(false)}
                      style={{ borderRadius: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={16} color="#3b82f6" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px' }}>Market Trends</strong>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>7-city macro rates & regimes</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* AI Valuation Studio Entry */}
              <Link
                to="/ai-valuation"
                className={`gd-nav-item gd-nav-ai-pill ${isActive('/ai-valuation') ? 'active' : ''}`}
                title="Open AST-XGB Multi-Model AI Valuation Studio"
              >
                <Sparkles size={15} />
                <span>AI Valuation</span>
              </Link>
            </nav>

            {/* Actions & Utilities */}
            <div className="gd-navbar-actions">
              {/* Post Free Property */}
              <Link to="/post-property" className="gd-btn-post" title="List your property for free">
                <PlusCircle size={15} />
                <span>Post Property</span>
              </Link>

              {/* Saved Properties */}
              <Link
                to="/account/saved"
                className="gd-icon-btn"
                title="Saved properties and portfolio"
                aria-label={`Saved Properties (${savedCount})`}
              >
                <Heart size={18} />
                {savedCount > 0 && <span className="gd-badge-count">{savedCount}</span>}
              </Link>

              {/* User Account / Sign In */}
              {isAuthenticated ? (
                <div
                  className="gd-field-group"
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setUserMenuOpen(true)}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    type="button"
                    className="gd-nav-item"
                    style={{
                      background: 'var(--gd-surface-elevated)',
                      border: '1px solid var(--gd-border)',
                      borderRadius: '100px',
                      padding: '4px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--gd-terra-500)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{user?.name.split(' ')[0]}</span>
                    <ChevronDown size={13} />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="gd-autocomplete-menu"
                      style={{
                        width: '210px',
                        right: 0,
                        left: 'auto',
                        padding: '8px',
                        boxShadow: 'var(--gd-shadow-lg)',
                      }}
                    >
                      <Link
                        to="/account/profile"
                        className="gd-autocomplete-item"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <User size={15} color="var(--gd-terra-500)" />
                        <span>My Account &amp; Profile</span>
                      </Link>
                      <Link
                        to="/account/saved"
                        className="gd-autocomplete-item"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Heart size={15} color="#ef4444" />
                        <span>Saved Properties ({savedCount})</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="gd-autocomplete-item"
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: '#ef4444',
                          borderRadius: '6px',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="gd-btn gd-btn-outline"
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                  }}
                >
                  <User size={15} />
                  <span>Sign In</span>
                </button>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                className="gd-icon-btn"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="gd-mobile-toggle"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Mobile Navigation Menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="gd-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="gd-drawer-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="gd-brand">
                <div className="gd-brand-icon" style={{ width: '32px', height: '32px', fontSize: '16px' }}>
                  <span>Gh</span>
                </div>
                <div className="gd-brand-text">
                  <h1 style={{ fontSize: '16px' }}>GharDhundo</h1>
                  <span style={{ fontSize: '10px' }}>AST-XGB</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gd-text-charcoal)' }}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <Link
                to="/buy"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                Buy Properties
              </Link>
              <Link
                to="/rent"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                Rent Homes
              </Link>
              <Link
                to="/pg"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                PG & Co-living
              </Link>
              <Link
                to="/plots"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                Plots & Land
              </Link>
              <Link
                to="/commercial"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                Commercial Real Estate
              </Link>
              <Link
                to="/new-projects"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                New Projects
              </Link>

              <hr style={{ borderColor: 'var(--gd-warm-border)', margin: '8px 0' }} />

              <Link
                to="/ai-valuation"
                className="gd-nav-item gd-nav-ai-pill"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Sparkles size={16} />
                <span>AI Valuation Studio</span>
              </Link>
              <Link
                to="/tools/emi-calculator"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calculator size={16} />
                <span>EMI Calculator</span>
              </Link>
              <Link
                to="/tools/compare"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Scale size={16} />
                <span>Compare Properties</span>
              </Link>
              <Link
                to="/market-insights"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <TrendingUp size={16} />
                <span>Market Insights</span>
              </Link>
              <Link
                to="/account/saved"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart size={16} />
                <span>Saved Properties ({savedCount})</span>
              </Link>
              <Link
                to="/account/profile"
                className="gd-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShieldCheck size={16} />
                <span>Settings & API Status</span>
              </Link>

              <hr style={{ borderColor: 'var(--gd-warm-border)', margin: '8px 0' }} />

              {/* Mobile Auth Actions */}
              {isAuthenticated ? (
                <>
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--gd-warm-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--gd-warm-border)',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gd-text-charcoal)' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gd-terra-600)', textTransform: 'capitalize', fontWeight: 600 }}>
                      {user?.role} Account • {user?.email}
                    </div>
                  </div>
                  <Link
                    to="/account"
                    className="gd-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={16} />
                    <span>My Account Portal</span>
                  </Link>
                  <button
                    type="button"
                    className="gd-nav-item"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', textAlign: 'left', width: '100%', cursor: 'pointer' }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="gd-btn-search"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal();
                  }}
                  style={{ width: '100%', justifyContent: 'center', height: '38px', fontSize: '13px' }}
                >
                  <User size={15} />
                  <span>Sign In / Register</span>
                </button>
              )}

              {/* Mobile Theme Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)', fontWeight: 600 }}>Theme Mode</span>
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="gd-icon-btn"
                  style={{ width: '36px', height: '36px' }}
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <Link
                to="/post-property"
                className="gd-btn-post"
                onClick={() => setMobileMenuOpen(false)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <PlusCircle size={16} />
                <span>Post Free Property</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
