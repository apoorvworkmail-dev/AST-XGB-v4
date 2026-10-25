import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, signup } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(authModalTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Buyer' | 'Owner' | 'Agent'>('Buyer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync tab with context when modal opens
  React.useEffect(() => {
    setActiveTab(authModalTab);
    setError(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await signup({ email, password, name, phone, role });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your entries.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="gd-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--gd-surface, #ffffff)',
          borderRadius: '16px',
          boxShadow: 'var(--gd-shadow-xl)',
          overflow: 'hidden',
          border: '1px solid var(--gd-border)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: '1px solid var(--gd-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--gd-surface-elevated)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--gd-text-primary)' }}>
              {activeTab === 'login' ? 'Sign In to GharDhundo' : 'Create Free Account'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
              AST-XGB Real Estate Valuation Architecture
            </span>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="gd-btn-icon"
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gd-border)' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'login' ? 'var(--gd-surface)' : 'var(--gd-surface-elevated)',
              fontWeight: 700,
              fontSize: '13.5px',
              color: activeTab === 'login' ? 'var(--gd-terra-600)' : 'var(--gd-text-muted)',
              borderBottom: activeTab === 'login' ? '2px solid var(--gd-terra-500)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'signup' ? 'var(--gd-surface)' : 'var(--gd-surface-elevated)',
              fontWeight: 700,
              fontSize: '13.5px',
              color: activeTab === 'signup' ? 'var(--gd-terra-600)' : 'var(--gd-text-muted)',
              borderBottom: activeTab === 'signup' ? '2px solid var(--gd-terra-500)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            New Registration
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '12.5px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeTab === 'signup' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--gd-text-muted)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="gd-input"
                      style={{ width: '100%', paddingLeft: '34px', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    I am a *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['Buyer', 'Owner', 'Agent'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`gd-bhk-pill ${role === r ? 'active' : ''}`}
                        style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                      >
                        {r === 'Buyer' ? 'Buyer / Tenant' : r === 'Owner' ? 'Property Owner' : 'Real Estate Agent'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--gd-text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="gd-input"
                  style={{ width: '100%', paddingLeft: '34px', fontSize: '13.5px' }}
                />
              </div>
            </div>

            {activeTab === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Mobile Number (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--gd-text-muted)' }} />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="gd-input"
                    style={{ width: '100%', paddingLeft: '34px', fontSize: '13.5px' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Password * {activeTab === 'signup' && <span style={{ color: 'var(--gd-text-muted)', fontWeight: 400 }}>(min 8 characters)</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--gd-text-muted)' }} />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="gd-input"
                  style={{ width: '100%', paddingLeft: '34px', fontSize: '13.5px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="gd-btn gd-btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '14px', marginTop: '6px' }}
            >
              {submitting ? 'Authenticating...' : activeTab === 'login' ? 'Sign In to Account' : 'Register Account'}
            </button>
          </form>

          {/* Guest Browsing Option & Security Disclosure */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--gd-border)', textAlign: 'center' }}>
            <button
              type="button"
              onClick={closeAuthModal}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gd-text-muted)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Continue Browsing as Guest
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'var(--gd-text-muted)',
                marginTop: '12px',
              }}
            >
              <ShieldCheck size={13} color="#10b981" />
              <span>Zero-Mock Policy: Server-side PBKDF2-SHA256 password cryptography. No fake social logins.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
