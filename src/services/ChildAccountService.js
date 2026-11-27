/**
 * ChildAccountService - local account state backed by server-verified auth.
 *
 * Credential hashes never live in the browser or in a client-readable table.
 * Registration, login, temporary-password recovery, resets and PIN checks are
 * performed by Vercel functions that use the Supabase service-role key.
 */
import { StorageService } from './StorageService';
import { SyncQueueService } from './SyncQueueService';

const CHILD_ACCOUNTS_KEY = 'makenna_child_accounts_v2';
const ACTIVE_CHILD_KEY = 'makenna_active_child_id';
const STORAGE_VERSION_KEY = 'makenna_storage_version';
const CHILD_TOKENS_KEY = 'makenna_child_tokens_v1';

// New IDs look like "kid20345635". The prefix is case-insensitive at login.
// Legacy "kid-1" accounts continue to work.
export const CHILD_ID_PATTERN = /^kid\d{8}$/i;
export const LEGACY_CHILD_ID_PATTERN = /^kid-\d+$/i;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SECRET_FIELDS = ['pinHash', 'passwordHash', 'tempPasswordHash', 'tempPasswordExpiresAt'];

const stampForSync = account => ({
  ...account,
  updatedAt: new Date().toISOString(),
  version: Number(account.version || 0) + 1,
});

const queueCloudChange = (type, account, childId, token = null) => {
  void import('./CloudSyncService')
    .then(({ CloudSyncService }) => {
      CloudSyncService.queueAccountChange(type, account, childId, token);
    })
    .catch(() => {
      // Offline or sync unavailable — the local write is already saved.
    });
};

/** POST to a first-party serverless function with a useful offline error. */
export const postApi = async (endpoint, body) => {
  let response;
  try {
    response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the cloud service. Check your connection and try again.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok || !data.success) {
    const error = new Error(data.error || 'Request failed. Please try again.');
    error.data = data;
    error.status = response.status;
    throw error;
  }
  return data;
};

export class ChildAccountService {
  static VERSION = 3;

  /**
   * Initialise storage and remove credential metadata left behind by older
   * browser-only versions. Server-verified accounts replace them at next login.
   */
  static initialize() {
    const version = StorageService.get(STORAGE_VERSION_KEY, 0);
    if (version < 2) this.migrateFromV1();
    if (version < this.VERSION) {
      this.saveAllAccounts(this.getAllAccounts().map(account => this.sanitize(account)));
    }
    StorageService.set(STORAGE_VERSION_KEY, this.VERSION);
  }

  static sanitize(account) {
    const clean = { ...account };
    SECRET_FIELDS.forEach(field => { delete clean[field]; });
    return clean;
  }

  static migrateFromV1() {
    const oldProfiles = StorageService.get('user_profiles', []);
    if (oldProfiles.length > 0) {
      const existingAccounts = this.getAllAccounts();
      oldProfiles.forEach(oldProfile => {
        if (!existingAccounts.find(a => a.fullName === oldProfile.name)) {
          existingAccounts.push({
            childId: this.generateChildId(existingAccounts),
            fullName: oldProfile.name.trim(),
            pinSet: false,
            passwordSet: false,
            parentEmail: null,
            requiresCredentialReset: true,
            avatar: oldProfile.avatar || 'default',
            createdAt: oldProfile.createdAt || new Date().toISOString(),
            lastLogin: null,
            progress: oldProfile.progress || {},
            settings: oldProfile.settings || {},
            migrated: true,
          });
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

  /** Local ID generation is only used for legacy v1 profile migration. */
  static generateChildId(existingAccounts = null) {
    const accounts = existingAccounts || this.getAllAccounts();
    const used = new Set(accounts.map(a => String(a.childId || '').toLowerCase()));

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const digits = String(this._randomInt(100000000)).padStart(8, '0');
      const childId = `kid${digits}`;
      if (!used.has(childId.toLowerCase())) return childId;
    }

    const digits = String(Date.now()).slice(-8).padStart(8, '0');
    return `kid${digits}`;
  }

  /**
   * Kept only for the device-local parent gate. Child credentials are hashed
   * and verified on the server by api/child-auth.js.
   */
  static async hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'makenna-salt-v2');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static hashCredential(credential) {
    return this.hashPin(credential);
  }

  static validatePin(pin) {
    return /^\d{4}$/.test(pin) || /^\d{8}$/.test(pin);
  }

  static validateEmail(email) {
    return typeof email === 'string' && EMAIL_PATTERN.test(email.trim());
  }

  static validatePassword(password) {
    return typeof password === 'string' && password.length >= 8 && password.length <= 128;
  }

  static validateName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50;
  }

  static getAllAccounts() {
    return StorageService.get(CHILD_ACCOUNTS_KEY, []);
  }

  static saveAllAccounts(accounts) {
    StorageService.set(CHILD_ACCOUNTS_KEY, accounts.map(account => this.sanitize(account)));
  }

  static getChildTokens() {
    return StorageService.get(CHILD_TOKENS_KEY, {});
  }

  static getChildToken(childId) {
    const id = this.normalizeChildId(childId);
    return id ? this.getChildTokens()[id] || null : null;
  }

  static _saveChildToken(childId, token) {
    if (!token) return;
    const tokens = this.getChildTokens();
    tokens[this.normalizeChildId(childId)] = token;
    StorageService.set(CHILD_TOKENS_KEY, tokens);
  }

  static _removeChildToken(childId) {
    const tokens = this.getChildTokens();
    delete tokens[this.normalizeChildId(childId)];
    StorageService.set(CHILD_TOKENS_KEY, tokens);
  }

  static _saveAccount(account, token = null) {
    const safe = this.sanitize(account);
    const accounts = this.getAllAccounts();
    const index = accounts.findIndex(a =>
      a.childId?.toLowerCase() === safe.childId?.toLowerCase());
    if (index === -1) accounts.push(safe);
    else accounts[index] = safe;
    this.saveAllAccounts(accounts);
    this._saveChildToken(safe.childId, token);
    return safe;
  }

  /**
   * Register a child. The server generates the ID, hashes the PIN and writes
   * the row with the service-role key; the browser only receives public fields.
   */
  static async registerChild(fullName, pin, parentEmail) {
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

    const normalized = fullName.trim().toLowerCase();
    if (this.getAllAccounts().some(a => a.fullName?.toLowerCase() === normalized)) {
      throw new Error('A child with this name already exists. Please choose a different name.');
    }

    const result = await postApi('child-auth', {
      action: 'register',
      fullName: fullName.trim(),
      pin,
      parentEmail: parentEmail.trim().toLowerCase(),
    });

    this._saveAccount(result.account, result.token);
    return {
      childId: result.account.childId,
      fullName: result.account.fullName,
      parentEmail: result.account.parentEmail,
    };
  }

  static normalizeChildId(childId) {
    if (!childId) return null;
    return childId.trim().toLowerCase();
  }

  static async _syncFromCloudIfAvailable() {
    try {
      const { CloudSyncService } = await import('./CloudSyncService');
      const result = await CloudSyncService.syncFromCloud();
      return result.success;
    } catch (err) {
      console.warn('Cloud sync skipped during login:', err.message);
      return false;
    }
  }

  /** Public alias used by recovery screens. */
  static syncAccountsFromCloud() {
    return this._syncFromCloudIfAvailable();
  }

  static _findAccount(childId) {
    const normalizedId = this.normalizeChildId(childId);
    if (!normalizedId) return null;
    return this.getAllAccounts().find(a => a.childId?.toLowerCase() === normalizedId) || null;
  }

  static _findBySupportIdentity(childId, parentEmail) {
    const account = this._findAccount(childId);
    if (!account) return null;
    if (!account.parentEmail || !this.validateEmail(parentEmail)) return null;
    if (account.parentEmail.toLowerCase() !== parentEmail.trim().toLowerCase()) return null;
    return account;
  }

  /** Local convenience check. The authoritative check runs in api/support.js. */
  static validateSupportIdentity(childId, parentEmail) {
    return this._findBySupportIdentity(childId, parentEmail);
  }

  /**
   * Issue a single-use temporary password. Requires a developer session token;
   * the plain value is returned only to the developer portal for mailing.
   */
  static async issueTemporaryPassword(childId, parentEmail, developerToken = null) {
    const result = await postApi('child-auth', {
      action: 'issue_temp_password',
      childId: this.normalizeChildId(childId),
      parentEmail,
      developerToken,
    });
    return result;
  }

  /**
   * Merge pending offline progress into the server account returned by login.
   * Login advances the server timestamp, so the preserved state is stamped and
   * re-queued before the next push would otherwise skip it as "older".
   */
  static _mergePendingLoginAccount(local, cloud) {
    if (!local) return cloud;

    const hasPendingWrite = SyncQueueService.getQueue().some(operation =>
      operation.type === 'UPSERT_ACCOUNT'
      && String(operation.childId || '').toLowerCase() === String(cloud.childId || '').toLowerCase());
    if (!hasPendingWrite) return cloud;

    const merged = {
      ...cloud,
      progress: { ...(cloud.progress || {}), ...(local.progress || {}) },
      settings: { ...(cloud.settings || {}), ...(local.settings || {}) },
      version: Math.max(Number(local.version || 0), Number(cloud.version || 0)) + 1,
      updatedAt: new Date().toISOString(),
    };
    queueCloudChange('UPSERT_ACCOUNT', merged);
    return merged;
  }

  /** Server-side credential verification. Never compares hashes in the browser. */
  static async loginChild(childId, credential) {
    const result = await postApi('child-auth', {
      action: 'login',
      childId: this.normalizeChildId(childId),
      credential,
    });

    const local = this.getChild(result.account.childId);
    const account = this._mergePendingLoginAccount(local, result.account);
    this._saveAccount(account, result.token);
    this.setActiveChild(account.childId);
    return {
      childId: account.childId,
      fullName: account.fullName,
      requiresCredentialReset: !!result.requiresCredentialReset,
    };
  }

  /** Replace a temporary password with a chosen PIN or password. */
  static async resetCredential(childId, newCredential, type = 'pin') {
    const token = this.getChildToken(childId);
    if (!token) throw new Error('Please log in again before resetting your credential.');

    const result = await postApi('child-auth', {
      action: 'reset_credential',
      childId: this.normalizeChildId(childId),
      token,
      newCredential,
      type,
    });

    this._saveAccount(result.account, token);
    return {
      childId: result.account.childId,
      fullName: result.account.fullName,
      credentialType: result.credentialType,
    };
  }

  static hasPendingCredentialReset(childId) {
    return !!this._findAccount(childId)?.requiresCredentialReset;
  }

  static getActiveChildId() {
    return StorageService.get(ACTIVE_CHILD_KEY);
  }

  static setActiveChild(childId) {
    StorageService.set(ACTIVE_CHILD_KEY, childId);
  }

  static logoutChild() {
    StorageService.remove(ACTIVE_CHILD_KEY);
  }

  static getActiveChild() {
    const childId = this.getActiveChildId();
    if (!childId) return null;
    const accounts = this.getAllAccounts();
    return accounts.find(a => a.childId?.toLowerCase() === childId?.toLowerCase()) || null;
  }

  static getChild(childId) {
    return this._findAccount(childId);
  }

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

  static deleteChild(childId) {
    const normalizedId = this.normalizeChildId(childId);
    let accounts = this.getAllAccounts();
    const removed = accounts.find(a => a.childId?.toLowerCase() === normalizedId);
    const token = this.getChildToken(normalizedId);
    accounts = accounts.filter(a => a.childId?.toLowerCase() !== normalizedId);
    this.saveAllAccounts(accounts);
    // Capture the signed device token before removing it. The queued cloud
    // delete needs that token to prove this device may delete the row.
    if (removed) queueCloudChange('DELETE_ACCOUNT', removed, removed.childId, token);
    this._removeChildToken(normalizedId);
    if (this.getActiveChildId()?.toLowerCase() === normalizedId) {
      this.logoutChild();
    }
  }

  static async verifyPin(childId, pin) {
    const token = this.getChildToken(childId);
    if (!token) return false;
    try {
      const result = await postApi('child-auth', {
        action: 'verify_pin',
        childId: this.normalizeChildId(childId),
        pin,
        token,
      });
      return !!result.valid;
    } catch {
      return false;
    }
  }

  static getChildProgress(childId, key, defaultValue = null) {
    const account = this.getChild(childId);
    return account?.progress?.[key] ?? defaultValue;
  }

  static setChildProgress(childId, key, value) {
    const accounts = this.getAllAccounts();
    const normalizedId = this.normalizeChildId(childId);
    const index = accounts.findIndex(a => a.childId?.toLowerCase() === normalizedId);
    if (index !== -1) {
      if (!accounts[index].progress) accounts[index].progress = {};
      accounts[index] = stampForSync({
        ...accounts[index],
        progress: { ...accounts[index].progress, [key]: value },
      });
      this.saveAllAccounts(accounts);
      queueCloudChange('UPSERT_ACCOUNT', accounts[index]);
    }
  }

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
