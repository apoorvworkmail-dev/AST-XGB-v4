/**
 * Phase 11 — Authentication & User Engagement API Client
 * AST-XGB Real Estate Platform (GharDhundo)
 */

import { getApiBaseUrl } from '../utils/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'Buyer' | 'Owner' | 'Agent';
  notification_prefs: {
    price_drop_alerts?: boolean;
    new_projects_in_city?: boolean;
    market_quarterly_report?: boolean;
    sms_updates?: boolean;
  };
  search_prefs: {
    preferred_city?: string;
    preferred_bhk?: number[];
    max_budget?: number;
  };
  created_at: string;
}

export interface UserInquiryItem {
  id: string;
  property_id: string;
  property_title: string;
  inquirer_name: string;
  inquirer_phone: string;
  inquirer_email: string;
  message: string;
  preferred_bhk?: string;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'closed';
  delivery_status: string;
  created_at: string;
}

const TOKEN_KEY = 'ast_xgb_session_token';
const USER_KEY = 'ast_xgb_user_cache';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setSession(token: string, user: UserProfile): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('ast_xgb_auth_change'));
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event('ast_xgb_auth_change'));
  },

  getCachedUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // ================= AUTH ENDPOINTS =================

  async signup(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || 'Failed to create account.');
    }

    this.setSession(json.session.token, json.user);
    return { user: json.user, token: json.session.token };
  },

  async login(credentials: { email: string; password: string }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || 'Invalid email or password.');
    }

    this.setSession(json.session.token, json.user);
    return { user: json.user, token: json.session.token };
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearSession();
    }
  },

  async fetchCurrentUser(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (res.status === 401) {
        this.clearSession();
        return null;
      }

      if (!res.ok) return null;
      const json = await res.json();
      localStorage.setItem(USER_KEY, JSON.stringify(json.user));
      return json.user;
    } catch {
      return this.getCachedUser();
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || 'Failed to update profile.');
    }

    localStorage.setItem(USER_KEY, JSON.stringify(json.user));
    window.dispatchEvent(new Event('ast_xgb_auth_change'));
    return json.user;
  },

  // ================= SAVED PROPERTIES SYNC =================

  async fetchServerSavedIds(): Promise<string[]> {
    if (!this.getToken()) return [];
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/user/saved-properties`, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.saved_property_ids || [];
    } catch {
      return [];
    }
  },

  async syncSavedProperties(localIds: string[]): Promise<string[]> {
    if (!this.getToken() || localIds.length === 0) return localIds;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/user/saved-properties/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ property_ids: localIds }),
      });
      if (!res.ok) return localIds;
      const json = await res.json();
      return json.saved_property_ids || localIds;
    } catch {
      return localIds;
    }
  },

  // ================= INQUIRIES =================

  async submitInquiry(data: {
    property_id: string;
    property_title: string;
    name: string;
    phone: string;
    email: string;
    message?: string;
    preferred_bhk?: string;
  }): Promise<{ id: string; status: string; delivery_notice: string }> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/inquiries`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || 'Inquiry submission failed.');
    }

    return json.inquiry;
  },

  async fetchUserInquiries(): Promise<{ inquiries: UserInquiryItem[]; gateway_notice: string }> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/user/inquiries`, {
      headers: this.getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || 'Failed to fetch inquiries.');
    }

    return {
      inquiries: json.inquiries || [],
      gateway_notice: json.gateway_notice || '',
    };
  },

  // ================= OWNER LISTINGS =================

  async fetchUserListings(): Promise<any[]> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/user/listings`, {
      headers: this.getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok) return [];
    return json.listings || [];
  },

  async saveOwnerListing(listing: any): Promise<any> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/user/listings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(listing),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || 'Failed to persist owner listing.');
    }
    return json.listing;
  },

  async deleteOwnerListing(listingId: string): Promise<boolean> {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/user/listings/${listingId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return res.ok;
  },
};
