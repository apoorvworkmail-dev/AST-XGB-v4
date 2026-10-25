/**
 * Storage Persistence Adapter
 * Provides a decoupled persistence layer for Shortlisted (Saved) and Compared Properties.
 * Currently uses localStorage for anonymous prototype usage, structured so an authenticated
 * cloud user profile backend can be swapped in without modifying UI components.
 * 
 * Security rule: NEVER store sensitive credentials or passwords in browser storage.
 */

const SAVED_PROPERTIES_KEY = 'ast_xgb_saved_ids';
const COMPARED_PROPERTIES_KEY = 'ast_xgb_compared_ids';
export const MAX_COMPARE_LIMIT = 4;

export const storageAdapter = {
  // ================= SHORTLIST / SAVED PROPERTIES =================

  getSavedPropertyIds(): string[] {
    try {
      const data = localStorage.getItem(SAVED_PROPERTIES_KEY);
      if (!data) return ['prop-blr-01']; // Default sample
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('storageAdapter: Error reading saved IDs', err);
      return [];
    }
  },

  isPropertySaved(id: string): boolean {
    const list = this.getSavedPropertyIds();
    return list.includes(id);
  },

  savePropertyId(id: string): string[] {
    const list = this.getSavedPropertyIds();
    if (!list.includes(id)) {
      const updated = [id, ...list];
      this._write(SAVED_PROPERTIES_KEY, updated);
      return updated;
    }
    return list;
  },

  removeSavedPropertyId(id: string): string[] {
    const list = this.getSavedPropertyIds();
    const updated = list.filter((item) => item !== id);
    this._write(SAVED_PROPERTIES_KEY, updated);
    return updated;
  },

  toggleSavePropertyId(id: string): { isSaved: boolean; updatedIds: string[] } {
    const list = this.getSavedPropertyIds();
    const exists = list.includes(id);
    let updated: string[];
    if (exists) {
      updated = list.filter((item) => item !== id);
    } else {
      updated = [id, ...list];
    }
    this._write(SAVED_PROPERTIES_KEY, updated);
    return { isSaved: !exists, updatedIds: updated };
  },

  clearAllSavedProperties(): void {
    this._write(SAVED_PROPERTIES_KEY, []);
  },

  // ================= PROPERTY COMPARISON SELECTION =================

  getComparedPropertyIds(): string[] {
    try {
      const data = localStorage.getItem(COMPARED_PROPERTIES_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE_LIMIT) : [];
    } catch (err) {
      console.warn('storageAdapter: Error reading compared IDs', err);
      return [];
    }
  },

  setComparedPropertyIds(ids: string[]): string[] {
    const trimmed = ids.slice(0, MAX_COMPARE_LIMIT);
    this._write(COMPARED_PROPERTIES_KEY, trimmed);
    return trimmed;
  },

  addComparedPropertyId(id: string): { success: boolean; ids: string[]; error?: string } {
    const current = this.getComparedPropertyIds();
    if (current.includes(id)) {
      return { success: true, ids: current };
    }
    if (current.length >= MAX_COMPARE_LIMIT) {
      return {
        success: false,
        ids: current,
        error: `You can compare up to ${MAX_COMPARE_LIMIT} properties simultaneously. Remove a property to add another.`,
      };
    }
    const updated = [...current, id];
    this._write(COMPARED_PROPERTIES_KEY, updated);
    return { success: true, ids: updated };
  },

  removeComparedPropertyId(id: string): string[] {
    const current = this.getComparedPropertyIds();
    const updated = current.filter((item) => item !== id);
    this._write(COMPARED_PROPERTIES_KEY, updated);
    return updated;
  },

  clearComparedProperties(): void {
    this._write(COMPARED_PROPERTIES_KEY, []);
  },

  // Internal safe write helper
  _write(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new Event('ast_xgb_storage_update'));
    } catch (err) {
      console.warn(`storageAdapter: Failed to persist ${key}`, err);
    }
  },
};
