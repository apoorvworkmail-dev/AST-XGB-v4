import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, Clock, User, Mail, Phone, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { PropertyListing } from '../../types/property';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyListing;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  property,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [visitDate, setVisitDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning (10 AM - 1 PM)');
  const [message, setMessage] = useState(
    `Hello, I would like to schedule a site visit and discuss details for ${property.title}.`
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [deliveryNotice, setDeliveryNotice] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const fullMessage = visitDate
        ? `${message} [Preferred Date: ${visitDate}, Slot: ${timeSlot}]`
        : message;

      const res = await authService.submitInquiry({
        property_id: property.id,
        property_title: property.title,
        name,
        phone,
        email,
        message: fullMessage,
        preferred_bhk: property.specs?.bhk ? `${property.specs.bhk} BHK` : undefined,
      });

      setReferenceId(res.id);
      setDeliveryNotice(res.delivery_notice);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to submit inquiry at this moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 8, 18, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--gd-warm-card)',
          border: '1px solid var(--gd-warm-border)',
          borderRadius: 'var(--gd-radius-xl)',
          padding: '28px',
          boxShadow: 'var(--gd-shadow-xl)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--gd-text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-charcoal)' }}>
              Inquiry Logged Successfully
            </h3>

            <p style={{ fontSize: '13.5px', color: 'var(--gd-text-slate)', margin: '0 0 16px 0' }}>
              Reference Ticket: <strong style={{ color: 'var(--gd-terra-600)', fontFamily: 'JetBrains Mono, monospace' }}>{referenceId}</strong>
            </p>

            <div style={{ background: 'var(--gd-warm-bg)', border: '1px solid var(--gd-warm-border)', borderRadius: '8px', padding: '14px', fontSize: '12px', color: 'var(--gd-text-muted)', lineHeight: 1.5, marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--gd-text-charcoal)', marginBottom: '4px' }}>
                <ShieldCheck size={14} color="#10b981" />
                <span>Server Database Persistence &amp; Gateway Disclosure</span>
              </div>
              {deliveryNotice || 'Inquiry securely recorded in platform SQLite database queue with authenticated reference ID.'}
            </div>

            <button
              type="button"
              className="gd-btn-search"
              onClick={handleReset}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--gd-terra-600)', fontWeight: 800, letterSpacing: '0.05em' }}>
                Schedule Visit &amp; Inquire
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--gd-text-charcoal)' }}>
                {property.title}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                Target Seller Category: <strong>{property.sellerLabel}</strong>
              </p>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
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
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-slate)', marginBottom: '4px' }}>
                    Your Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Verma"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 32px',
                        borderRadius: 'var(--gd-radius-md)',
                        border: '1px solid var(--gd-warm-border)',
                        background: 'var(--gd-warm-bg)',
                        color: 'var(--gd-text-charcoal)',
                        fontSize: '13px',
                      }}
                    />
                    <User size={15} color="var(--gd-text-muted)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-slate)', marginBottom: '4px' }}>
                    Contact Phone *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 32px',
                        borderRadius: 'var(--gd-radius-md)',
                        border: '1px solid var(--gd-warm-border)',
                        background: 'var(--gd-warm-bg)',
                        color: 'var(--gd-text-charcoal)',
                        fontSize: '13px',
                      }}
                    />
                    <Phone size={15} color="var(--gd-text-muted)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-slate)', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@example.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 32px',
                      borderRadius: 'var(--gd-radius-md)',
                      border: '1px solid var(--gd-warm-border)',
                      background: 'var(--gd-warm-bg)',
                      color: 'var(--gd-text-charcoal)',
                      fontSize: '13px',
                    }}
                  />
                  <Mail size={15} color="var(--gd-text-muted)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-slate)', marginBottom: '4px' }}>
                    Preferred Visit Date
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--gd-radius-md)',
                      border: '1px solid var(--gd-warm-border)',
                      background: 'var(--gd-warm-bg)',
                      color: 'var(--gd-text-charcoal)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-slate)', marginBottom: '4px' }}>
                    Time Window
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--gd-radius-md)',
                      border: '1px solid var(--gd-warm-border)',
                      background: 'var(--gd-warm-bg)',
                      color: 'var(--gd-text-charcoal)',
                      fontSize: '13px',
                    }}
                  >
                    <option>Morning (10 AM - 1 PM)</option>
                    <option>Afternoon (1 PM - 4 PM)</option>
                    <option>Evening (4 PM - 7 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-slate)', marginBottom: '4px' }}>
                  Custom Note / Questions
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--gd-radius-md)',
                    border: '1px solid var(--gd-warm-border)',
                    background: 'var(--gd-warm-bg)',
                    color: 'var(--gd-text-charcoal)',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="gd-btn-search"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '8px',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Submitting...' : 'Send Inquiry Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
