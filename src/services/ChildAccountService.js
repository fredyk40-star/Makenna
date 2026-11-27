/**
 * ChildAccountService - Manages child accounts with secure PIN/password storage
 * Stores accounts in localStorage with Supabase cloud sync for cross-device access
 */
import { StorageService } from './StorageService';

const CHILD_ACCOUNTS_KEY = 'makenna_child_accounts_v2';
const ACTIVE_CHILD_KEY = 'makenna_active_child_id';
const STORAGE_VERSION_KEY = 'makenna_storage_version';

// New IDs look like "kid20345635". The prefix is case-insensitive at login.
// Legacy "kid-1" accounts continue to work.
export const CHILD_ID_PATTERN = /^kid\d{8}$/i;
export const LEGACY_CHILD_ID_PATTERN = /^kid-\d+$/i;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const TEMP_PASSWORD_MINUTES = 30;
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';

// Dynamic import avoids a circular dependency (CloudSyncService reads accounts).
const stampForSync = account => ({
  ...account,
  updatedAt: new Date().toISOString(),
  version: Number(account.version || 0) + 1,
});

const queueCloudChange = (type, account, childId) => {
  void import('./CloudSyncService')
    .then(({ CloudSyncService }) => {
      CloudSyncService.queueAccountChange(type, account, childId);
    })
    .catch(() => {
      // Offline or sync unavailable — the local write is already saved.
    });
};

export class ChildAccountService {
  static VERSION = 2;

  /**
   * Initialize storage version and migrate if needed
   */
  static initialize() {
    const version = StorageService.get(STORAGE_VERSION_KEY, 0);
    if (version < this.VERSION) {
      this.migrateFromV1();
      StorageService.set(STORAGE_VERSION_KEY, this.VERSION);
    }
  }

  /**
   * Migrate old profile data to new child account format
   */
  static migrateFromV1() {
    const oldProfiles = StorageService.get('user_profiles', []);
    if (oldProfiles.length > 0) {
      const existingAccounts = this.getAllAccounts();
      oldProfiles.forEach(oldProfile => {
        if (!existingAccounts.find(a => a.fullName === oldProfile.name)) {
          const newAccount = {
            childId: this.generateChildId(existingAccounts),
            fullName: oldProfile.name.trim(),
            pinHash: null, // No PIN in old system - will need to be set
            pinSet: false,
            parentEmail: null,
            avatar: oldProfile.avatar || 'default',
            createdAt: oldProfile.createdAt || new Date().toISOString(),
            lastLogin: null,
            progress: oldProfile.progress || {},
            settings: oldProfile.settings || {},
            migrated: true,
          };
          existingAccounts.push(newAccount);
        }
      });
      this.saveAllAccounts(existingAccounts);
    }
  }

  static _randomInt(max) {
    if (globalThis.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      globalThis.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  /**
   * Generate a unique child ID in the form kid20345635.
   * Legacy kid-N accounts are left untouched by migration.
   */
  static generateChildId(existingAccounts = null) {
    const accounts = existingAccounts || this.getAllAccounts();
    const used = new Set(accounts.map(a => String(a.childId || '').toLowerCase()));

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const digits = String(this._randomInt(100000000)).padStart(8, '0');
      const childId = `kid${digits}`;
      if (!used.has(childId.toLowerCase())) return childId;
    }

    // Extremely unlikely collision fallback: still keep the documented shape.
    const digits = String(Date.now()).slice(-8).padStart(8, '0');
    return `kid${digits}`;
  }

  /**
   * Hash a PIN using Web Crypto API (SHA-256)
   */
  static async hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'makenna-salt-v2');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /** PINs and chosen passwords use the same one-way digest. */
  static hashCredential(credential) {
    return this.hashPin(credential);
  }

  /**
   * Validate PIN format (4 or 8 digits)
   */
  static validatePin(pin) {
    return /^\d{4}$/.test(pin) || /^\d{8}$/.test(pin);
  }

  /** A parent email is mandatory so recovery is possible. */
  static validateEmail(email) {
    return typeof email === 'string' && EMAIL_PATTERN.test(email.trim());
  }

  /** Password option after a temporary-password login. */
  static validatePassword(password) {
    return typeof password === 'string' && password.length >= 8 && password.length <= 128;
  }

  /**
   * Validate child name
   */
  static validateName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50;
  }

  /**
   * Get all child accounts
   */
  static getAllAccounts() {
    return StorageService.get(CHILD_ACCOUNTS_KEY, []);
  }

  /**
   * Save all child accounts
   */
  static saveAllAccounts(accounts) {
    StorageService.set(CHILD_ACCOUNTS_KEY, accounts);
  }

  /**
   * Register a new child account. Every account is queued for cloud persistence.
   */
  static async registerChild(fullName, pin, parentEmail) {
    // Validate inputs
    if (!this.validateName(fullName)) {
      throw new Error('Please enter a valid name (1-50 characters).');
    }
    if (!this.validatePin(pin)) {
      throw new Error('PIN must be 4 or 8 digits.');
    }
    if (!this.validateEmail(parentEmail)) {
      throw new Error(
        'A parent email is required. Without it, this account cannot be recovered and will be lost forever.'
      );
    }

    const accounts = this.getAllAccounts();

    // Check for duplicate name
    const normalized = fullName.trim().toLowerCase();
    if (accounts.some(a => a.fullName.toLowerCase() === normalized)) {
      throw new Error('A child with this name already exists. Please choose a different name.');
    }

    // Check for duplicate PIN (security measure)
    const pinHash = await this.hashPin(pin);
    if (accounts.some(a => a.pinHash === pinHash && a.pinSet)) {
      throw new Error('This PIN is already in use. Please choose a different PIN.');
    }

    const childId = this.generateChildId(accounts);
    const newAccount = {
      childId,
      fullName: fullName.trim(),
      pinHash,
      pinSet: true,
      passwordHash: null,
      passwordSet: false,
      parentEmail: parentEmail.trim().toLowerCase(),
      tempPasswordHash: null,
      tempPasswordExpiresAt: null,
      requiresCredentialReset: false,
      avatar: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      lastLogin: null,
      progress: {},
      settings: {},
      migrated: false,
    };

    accounts.push(newAccount);
    this.saveAllAccounts(accounts);
    queueCloudChange('UPSERT_ACCOUNT', newAccount);
    return {
      childId,
      fullName: newAccount.fullName,
      parentEmail: newAccount.parentEmail,
    };
  }

  /**
   * Normalize child ID to lowercase (e.g., KID20345635 -> kid20345635)
   */
  static normalizeChildId(childId) {
    if (!childId) return null;
    return childId.trim().toLowerCase();
  }

  /**
   * Try to sync accounts from Supabase cloud to localStorage.
   * Returns true if sync was attempted and accounts were merged.
   */
  static async _syncFromCloudIfAvailable() {
    try {
      const { isSupabaseConfigured } = await import('./SupabaseService');
      if (!isSupabaseConfigured()) return false;

      const { CloudSyncService } = await import('./CloudSyncService');
      const result = await CloudSyncService.syncFromCloud();
      return result.success;
    } catch (err) {
      // Offline or Supabase unavailable — silently continue with local data
      console.warn('Cloud sync skipped during login:', err.message);
      return false;
    }
  }

  /** Public alias used by support and recovery screens. */
  static syncAccountsFromCloud() {
    return this._syncFromCloudIfAvailable();
  }

  static _findAccount(childId) {
    const normalizedId = this.normalizeChildId(childId);
    if (!normalizedId) return null;
    return this.getAllAccounts().find(a => a.childId?.toLowerCase() === normalizedId) || null;
  }

  /** Child ID + parent email pair used by the support/recovery flow. */
  static _findBySupportIdentity(childId, parentEmail) {
    const account = this._findAccount(childId);
    if (!account) return null;
    if (!account.parentEmail || !this.validateEmail(parentEmail)) return null;
    if (account.parentEmail.toLowerCase() !== parentEmail.trim().toLowerCase()) return null;
    return account;
  }

  static validateSupportIdentity(childId, parentEmail) {
    return this._findBySupportIdentity(childId, parentEmail);
  }

  static _newTemporaryPassword() {
    let value = '';
    for (let i = 0; i < 14; i += 1) {
      value += TEMP_PASSWORD_CHARS[this._randomInt(TEMP_PASSWORD_CHARS.length)];
    }
    return value;
  }

  /**
   * Issue a single-use temporary password after the developer verifies a
   * support request. The plain value is returned only to the mailer UI.
   */
  static async issueTemporaryPassword(childId, parentEmail) {
    const account = this._findBySupportIdentity(childId, parentEmail);
    if (!account) {
      throw new Error('No account was found for that Child ID and parent email.');
    }

    const tempPassword = this._newTemporaryPassword();
    const tempPasswordHash = await this.hashCredential(tempPassword);
    const expiresAt = new Date(Date.now() + TEMP_PASSWORD_MINUTES * 60 * 1000).toISOString();

    const updated = this.updateChild(account.childId, {
      tempPasswordHash,
      tempPasswordExpiresAt: expiresAt,
      requiresCredentialReset: true,
    });

    return {
      childId: updated.childId,
      fullName: updated.fullName,
      parentEmail: updated.parentEmail,
      tempPassword,
      expiresAt,
    };
  }

  /**
   * Login a child with ID and credential (case-insensitive ID). A temporary
   * password forces a PIN reset or password choice before normal use.
   */
  static async loginChild(childId, credential) {
    const normalizedId = this.normalizeChildId(childId);

    // First attempt: check localStorage
    let accounts = this.getAllAccounts();
    let account = accounts.find(a => a.childId?.toLowerCase() === normalizedId);

    // Second attempt: if not found locally, try pulling from Supabase cloud
    if (!account) {
      const synced = await this._syncFromCloudIfAvailable();
      if (synced) {
        // Re-read accounts after cloud sync
        accounts = this.getAllAccounts();
        account = accounts.find(a => a.childId?.toLowerCase() === normalizedId);
      }
    }

    if (!account) {
      throw new Error('Invalid Child ID or password. Please try again.');
    }

    if (!account.pinSet && !account.passwordSet && !account.tempPasswordHash) {
      throw new Error('This account has no credential set. Please contact a parent.');
    }

    const credentialHash = await this.hashCredential(credential);

    const tempValid = !!(
      account.tempPasswordHash
      && account.tempPasswordHash === credentialHash
      && account.tempPasswordExpiresAt
      && new Date(account.tempPasswordExpiresAt).getTime() > Date.now()
    );

    if (account.requiresCredentialReset && !tempValid) {
      throw new Error('A temporary password is active. Ask your parent to use it to set a new PIN or password.');
    }

    const regularValid = (
      (account.passwordSet && account.passwordHash === credentialHash)
      || (account.pinSet && account.pinHash === credentialHash)
    );

    if (!tempValid && !regularValid) {
      throw new Error('Invalid Child ID or password. Please try again.');
    }

    // Update last login
    const updated = stampForSync({ ...account, lastLogin: new Date().toISOString() });
    const accountIndex = accounts.findIndex(item => item.childId === account.childId);
    if (accountIndex !== -1) accounts[accountIndex] = updated;
    this.saveAllAccounts(accounts);
    queueCloudChange('UPSERT_ACCOUNT', updated);

    // Set as active
    this.setActiveChild(account.childId);
    return {
      childId: account.childId,
      fullName: account.fullName,
      requiresCredentialReset: tempValid || !!account.requiresCredentialReset,
    };
  }

  /**
   * Replace a temporary password with a chosen PIN or password.
   */
  static async resetCredential(childId, newCredential, type = 'pin') {
    const account = this._findAccount(childId);
    if (!account) throw new Error('Account not found. Please log in again.');

    let updates;
    if (type === 'password') {
      if (!this.validatePassword(newCredential)) {
        throw new Error('Password must be between 8 and 128 characters.');
      }
      const passwordHash = await this.hashCredential(newCredential);
      updates = {
        passwordHash,
        passwordSet: true,
        pinHash: null,
        pinSet: false,
      };
    } else {
      if (!this.validatePin(newCredential)) {
        throw new Error('PIN must be 4 or 8 digits.');
      }
      const pinHash = await this.hashCredential(newCredential);
      updates = {
        pinHash,
        pinSet: true,
        passwordHash: null,
        passwordSet: false,
      };
    }

    const updated = this.updateChild(account.childId, {
      ...updates,
      tempPasswordHash: null,
      tempPasswordExpiresAt: null,
      requiresCredentialReset: false,
    });

    return { childId: updated.childId, fullName: updated.fullName, credentialType: type };
  }

  static hasPendingCredentialReset(childId) {
    return !!this._findAccount(childId)?.requiresCredentialReset;
  }

  /**
   * Get active child ID
   */
  static getActiveChildId() {
    return StorageService.get(ACTIVE_CHILD_KEY);
  }

  /**
   * Set active child
   */
  static setActiveChild(childId) {
    StorageService.set(ACTIVE_CHILD_KEY, childId);
  }

  /**
   * Clear active child (logout)
   */
  static logoutChild() {
    StorageService.remove(ACTIVE_CHILD_KEY);
  }

  /**
   * Get active child account (case-insensitive)
   */
  static getActiveChild() {
    const childId = this.getActiveChildId();
    if (!childId) return null;
    const accounts = this.getAllAccounts();
    return accounts.find(a => a.childId?.toLowerCase() === childId?.toLowerCase()) || null;
  }

  /**
   * Get child by ID (case-insensitive)
   */
  static getChild(childId) {
    return this._findAccount(childId);
  }

  /**
   * Update child account (case-insensitive)
   */
  static updateChild(childId, updates) {
    const accounts = this.getAllAccounts();
    const normalizedId = this.normalizeChildId(childId);
    const index = accounts.findIndex(a => a.childId?.toLowerCase() === normalizedId);
    if (index !== -1) {
      accounts[index] = stampForSync({ ...accounts[index], ...updates });
      this.saveAllAccounts(accounts);
      queueCloudChange('UPSERT_ACCOUNT', accounts[index]);
      return accounts[index];
    }
    return null;
  }

  /**
   * Delete child account (case-insensitive)
   */
  static deleteChild(childId) {
    const normalizedId = this.normalizeChildId(childId);
    let accounts = this.getAllAccounts();
    const removed = accounts.find(a => a.childId?.toLowerCase() === normalizedId);
    accounts = accounts.filter(a => a.childId?.toLowerCase() !== normalizedId);
    this.saveAllAccounts(accounts);
    if (removed) queueCloudChange('DELETE_ACCOUNT', removed, removed.childId);
    if (this.getActiveChildId()?.toLowerCase() === normalizedId) {
      this.logoutChild();
    }
  }

  /**
   * Verify PIN/password for parent zone access (case-insensitive)
   */
  static async verifyPin(childId, pin) {
    const account = this._findAccount(childId);
    if (!account || (!account.pinSet && !account.passwordSet)) return false;
    const hash = await this.hashCredential(pin);
    return (account.pinSet && account.pinHash === hash)
      || (account.passwordSet && account.passwordHash === hash);
  }

  /**
   * Get child progress data (case-insensitive)
   */
  static getChildProgress(childId, key, defaultValue = null) {
    const account = this.getChild(childId);
    return account?.progress?.[key] ?? defaultValue;
  }

  /**
   * Set child progress data (case-insensitive)
   */
  static setChildProgress(childId, key, value) {
    const accounts = this.getAllAccounts();
    const normalizedId = this.normalizeChildId(childId);
    const index = accounts.findIndex(a => a.childId?.toLowerCase() === normalizedId);
    if (index !== -1) {
      if (!accounts[index].progress) {
        accounts[index].progress = {};
      }
      accounts[index] = stampForSync({
        ...accounts[index],
        progress: { ...accounts[index].progress, [key]: value },
      });
      this.saveAllAccounts(accounts);
      queueCloudChange('UPSERT_ACCOUNT', accounts[index]);
    }
  }

  /**
   * Get all children names and IDs (for parent dashboard)
   */
  static getAllChildrenSummary() {
    return this.getAllAccounts().map(a => ({
      childId: a.childId,
      fullName: a.fullName,
      parentEmail: a.parentEmail || null,
      createdAt: a.createdAt,
      lastLogin: a.lastLogin,
    }));
  }
}
