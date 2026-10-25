import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  Scale,
  Search,
  MessageSquare,
  Building,
  Bell,
  Activity,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Trash2,
  ChevronRight,
  ExternalLink,
  Edit2,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService, UserInquiryItem } from '../services/authService';
import { storageAdapter } from '../services/storageAdapter';
import { DEMO_LISTINGS } from '../data/demoListings';
import { PropertyCard } from '../components/listing/PropertyCard';
import { PropertyListing } from '../types/property';
import { SettingsView } from '../components/SettingsView';

interface AccountPageProps {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  theme,
  setTheme,
  savedIds,
  onToggleSave,
}) => {
  const { user, isAuthenticated, logout, updateProfile, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'saved' | 'inquiries' | 'listings' | 'preferences' | 'diagnostics'>('profile');

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState(user?.role || 'Buyer');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    price_drop_alerts: user?.notification_prefs?.price_drop_alerts ?? true,
    new_projects_in_city: user?.notification_prefs?.new_projects_in_city ?? true,
    market_quarterly_report: user?.notification_prefs?.market_quarterly_report ?? false,
    sms_updates: user?.notification_prefs?.sms_updates ?? false,
  });

  // Inquiries State
  const [inquiries, setInquiries] = useState<UserInquiryItem[]>([]);
  const [gatewayNotice, setGatewayNotice] = useState<string>('');
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Owner Listings State
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Sync state when user loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setRole(user.role);
      if (user.notification_prefs) {
        setNotificationPrefs({
          price_drop_alerts: user.notification_prefs.price_drop_alerts ?? true,
          new_projects_in_city: user.notification_prefs.new_projects_in_city ?? true,
          market_quarterly_report: user.notification_prefs.market_quarterly_report ?? false,
          sms_updates: user.notification_prefs.sms_updates ?? false,
        });
      }
    }
  }, [user]);

  // Load inquiries when tab selected
  useEffect(() => {
    if (activeTab === 'inquiries' && isAuthenticated) {
      setLoadingInquiries(true);
      authService.fetchUserInquiries().then((res) => {
        setInquiries(res.inquiries);
        setGatewayNotice(res.gateway_notice);
        setLoadingInquiries(false);
      }).catch(() => setLoadingInquiries(false));
    }
  }, [activeTab, isAuthenticated]);

  // Load owner listings when tab selected
  useEffect(() => {
    if (activeTab === 'listings' && isAuthenticated) {
      setLoadingListings(true);
      authService.fetchUserListings().then((items) => {
        setUserListings(items);
        setLoadingListings(false);
      }).catch(() => setLoadingListings(false));
    }
  }, [activeTab, isAuthenticated]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateProfile({ name, phone, role, notification_prefs: notificationPrefs });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to remove this property listing from the server database?')) return;
    const success = await authService.deleteOwnerListing(listingId);
    if (success) {
      setUserListings((prev) => prev.filter((l) => l.id !== listingId));
    }
  };

  // Saved properties items from IDs
  const savedPropertyList = DEMO_LISTINGS.filter((p) => savedIds.includes(p.id));

  // If Guest (Unauthenticated)
  if (!isAuthenticated) {
    return (
      <div className="gd-container" style={{ minHeight: '75vh', padding: '60px 20px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'var(--gd-surface)', padding: '40px', borderRadius: '16px', border: '1px solid var(--gd-border)', boxShadow: 'var(--gd-shadow-md)' }}>
          <User size={48} color="var(--gd-terra-500)" style={{ margin: '0 auto 16px auto' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-primary)' }}>
            User Account &amp; Preferences
          </h1>
          <p style={{ color: 'var(--gd-text-muted)', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '24px' }}>
            Sign in to synchronize saved properties across devices, review status of submitted property inquiries, manage owner listings, and personalize alert notifications.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="gd-btn gd-btn-primary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="gd-btn gd-btn-outline"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              Create Free Account
            </button>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--gd-surface-elevated)', border: '1px solid var(--gd-border)', textAlign: 'left', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--gd-text-primary)', marginBottom: '4px' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>Guest Browsing Fully Supported</span>
            </div>
            <span>
              You do not need an account to search properties, view AI valuations, simulate what-if scenarios, or compare homes. Local shortlist items will merge seamlessly once you log in.
            </span>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'left', borderTop: '1px solid var(--gd-border)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>System Diagnostics</h3>
            <SettingsView theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Portal
  return (
    <div className="gd-container" style={{ minHeight: '80vh', padding: '36px 20px 80px 20px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          padding: '24px 28px',
          backgroundColor: 'var(--gd-surface-elevated)',
          borderRadius: '16px',
          border: '1px solid var(--gd-border)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--gd-terra-500)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800,
            }}
          >
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--gd-text-primary)' }}>
                {user?.name}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'var(--gd-terra-50)',
                  color: 'var(--gd-terra-600)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--gd-terra-200)',
                }}
              >
                {user?.role}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gd-text-muted)', marginTop: '2px' }}>
              {user?.email} • Member since {new Date(user?.created_at || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="gd-btn gd-btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2. Navigation Tabs & Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <aside style={{ backgroundColor: 'var(--gd-surface-elevated)', borderRadius: '12px', border: '1px solid var(--gd-border)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'profile', label: 'Profile & Contact', icon: User },
            { id: 'saved', label: `Saved Properties (${savedIds.length})`, icon: Heart },
            { id: 'inquiries', label: 'My Inquiries', icon: MessageSquare },
            { id: 'listings', label: 'Owner Listings', icon: Building },
            { id: 'preferences', label: 'Alert Preferences', icon: Bell },
            { id: 'diagnostics', label: 'Model Diagnostics', icon: Activity },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isSel ? 'var(--gd-terra-50)' : 'transparent',
                  color: isSel ? 'var(--gd-terra-600)' : 'var(--gd-text-primary)',
                  fontWeight: isSel ? 700 : 500,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isSel ? 'var(--gd-terra-500)' : 'var(--gd-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Panel */}
        <div style={{ backgroundColor: 'var(--gd-surface)', borderRadius: '16px', border: '1px solid var(--gd-border)', padding: '28px' }}>
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--gd-text-primary)' }}>
                Personal Profile &amp; Contact Information
              </h2>

              {saveSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  <CheckCircle2 size={16} />
                  <span>Profile updated and synchronized to backend database.</span>
                </div>
              )}

              {saveError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{saveError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="gd-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Email Address <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>(Primary login identifier)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email}
                    className="gd-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="gd-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Account Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="gd-select"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
                  >
                    <option value="Buyer">Property Buyer / Tenant</option>
                    <option value="Owner">Individual Property Owner</option>
                    <option value="Agent">Real Estate Broker / Agent</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="gd-btn gd-btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '14px', marginTop: '8px' }}
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SAVED PROPERTIES */}
          {activeTab === 'saved' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--gd-text-primary)' }}>
                  Saved Properties &amp; Comparison Shortlist
                </h2>
                <Link to="/tools/compare" className="gd-btn gd-btn-outline" style={{ fontSize: '12.5px', padding: '6px 14px' }}>
                  <Scale size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />
                  Compare Side-by-Side
                </Link>
              </div>

              {savedPropertyList.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {savedPropertyList.map((item) => (
                    <PropertyCard
                      key={item.id}
                      property={item}
                      isSaved={true}
                      onToggleSave={onToggleSave}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <Heart size={40} color="var(--gd-text-muted)" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>No Saved Properties Yet</h4>
                  <p style={{ color: 'var(--gd-text-muted)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                    Click the heart icon on any property card or detail view to add homes to your shortlisted portfolio.
                  </p>
                  <Link to="/buy" className="gd-btn gd-btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                    Browse Listings
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INQUIRIES & ADVISORY STATUS */}
          {activeTab === 'inquiries' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-primary)' }}>
                Property Inquiries &amp; Site Visit Requests
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--gd-text-muted)', margin: '0 0 20px 0' }}>
                Track the progress of your inquiries submitted to owners and developer advisory desks.
              </p>

              {/* Gateway Unconfigured Disclosure Notice */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 18px',
                  backgroundColor: 'rgba(235, 94, 40, 0.08)',
                  border: '1px solid rgba(235, 94, 40, 0.2)',
                  borderRadius: '10px',
                  marginBottom: '24px',
                  fontSize: '12.5px',
                  color: 'var(--gd-text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <HelpCircle size={18} color="var(--gd-terra-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--gd-terra-600)', marginBottom: '2px' }}>
                    Honest Gateway Integration Status:
                  </strong>
                  <span>
                    External carrier SMS/Email dispatch gateways are unconfigured in this demonstration environment. 
                    Inquiries are stored directly in the backend SQLite database queue with timestamp and reference ID.
                  </span>
                </div>
              </div>

              {loadingInquiries ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading inquiries...</div>
              ) : inquiries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      style={{
                        padding: '18px',
                        backgroundColor: 'var(--gd-surface-elevated)',
                        borderRadius: '10px',
                        border: '1px solid var(--gd-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '15px', color: 'var(--gd-text-primary)' }}>{inq.property_title}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', marginTop: '2px' }}>
                            Ref ID: <code style={{ fontFamily: 'monospace' }}>{inq.id}</code> • Submitted: {new Date(inq.created_at).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '100px',
                            backgroundColor: inq.status === 'acknowledged' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: inq.status === 'acknowledged' ? '#10b981' : '#f59e0b',
                            textTransform: 'uppercase',
                          }}
                        >
                          {inq.status === 'acknowledged' ? 'Advisory Acknowledged' : 'Queued in Database'}
                        </span>
                      </div>

                      {inq.message && (
                        <p style={{ fontSize: '13px', color: 'var(--gd-text-secondary)', margin: '8px 0', backgroundColor: 'var(--gd-surface)', padding: '10px', borderRadius: '6px' }}>
                          &ldquo;{inq.message}&rdquo;
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--gd-text-muted)', marginTop: '8px' }}>
                        <span>Contact: {inq.inquirer_phone}</span>
                        <span>Email: {inq.inquirer_email}</span>
                        {inq.preferred_bhk && <span>Config: {inq.preferred_bhk}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <MessageSquare size={36} color="var(--gd-text-muted)" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ color: 'var(--gd-text-muted)', fontSize: '13.5px' }}>
                    You have not submitted any inquiries yet. Inquire on any property page or project listing to contact sellers.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OWNER LISTINGS */}
          {activeTab === 'listings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--gd-text-primary)' }}>
                    My Posted Properties
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--gd-text-muted)', margin: '2px 0 0 0' }}>
                    Manage listings posted under your user account with backend database persistence.
                  </p>
                </div>
                <Link to="/post-property" className="gd-btn gd-btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                  + Post New Listing
                </Link>
              </div>

              {loadingListings ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading owner listings...</div>
              ) : userListings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {userListings.map((listing) => (
                    <div
                      key={listing.id}
                      style={{
                        padding: '16px 20px',
                        backgroundColor: 'var(--gd-surface-elevated)',
                        borderRadius: '10px',
                        border: '1px solid var(--gd-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '15px' }}>{listing.title}</strong>
                        <div style={{ fontSize: '12.5px', color: 'var(--gd-text-muted)', marginTop: '2px' }}>
                          {listing.location?.locality}, {listing.location?.city} • {listing.priceFormatted}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link
                          to={`/property/${listing.slug || listing.id}`}
                          className="gd-btn gd-btn-outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(listing.id)}
                          className="gd-btn gd-btn-outline"
                          style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444' }}
                          title="Delete Listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <Building size={36} color="var(--gd-text-muted)" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ color: 'var(--gd-text-muted)', fontSize: '13.5px', marginBottom: '14px' }}>
                    You have not posted any property listings yet.
                  </p>
                  <Link to="/post-property" className="gd-btn gd-btn-outline">
                    Post a Free Property Listing
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ALERT PREFERENCES */}
          {activeTab === 'preferences' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--gd-text-primary)' }}>
                Notification &amp; Property Alert Preferences
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '540px' }}>
                {[
                  { id: 'price_drop_alerts', title: 'Price Drop Notifications', desc: 'Receive instant alert when a shortlisted property price drops by 3% or more.' },
                  { id: 'new_projects_in_city', title: 'New Project Launch Alerts', desc: 'Get updates on approved township launches in your preferred cities.' },
                  { id: 'market_quarterly_report', title: 'AST-XGB Quarterly Macro Index', desc: 'Quarterly NHB HPI, RBI Repo, and inflation regime updates.' },
                  { id: 'sms_updates', title: 'SMS / WhatsApp Critical Updates', desc: 'Direct mobile alerts for inquiry callbacks from property owners.' },
                  { id: 'personalized_recommendations', title: 'Personalized Recommendation Consent', desc: 'Allow recommendation engine to incorporate your saved properties and search history across sessions. When disabled (default), recommendations remain strictly content-based on the active property.' },
                ].map((pref) => (
                  <div
                    key={pref.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '16px',
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--gd-surface-elevated)',
                      border: '1px solid var(--gd-border)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block', marginBottom: '2px' }}>{pref.title}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>{pref.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={(notificationPrefs as any)[pref.id]}
                      onChange={(e) => {
                        const updated = { ...notificationPrefs, [pref.id]: e.target.checked };
                        setNotificationPrefs(updated);
                        updateProfile({ notification_prefs: updated });
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gd-terra-500)', marginTop: '4px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--gd-text-primary)' }}>
                System Diagnostics &amp; Model Specifications
              </h2>
              <SettingsView theme={theme} setTheme={setTheme} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
