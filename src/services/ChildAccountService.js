/**
 * ChildAccountService - Manages child accounts with secure PIN storage
 * Replaces the old ProfileService with a child-account system
 */
import { StorageService } from './StorageService';

const CHILD_ACCOUNTS_KEY = 'makenna_child_accounts_v2';
const ACTIVE_CHILD_KEY = 'makenna_active_child_id';
const STORAGE_VERSION_KEY = 'makenna_storage_version';

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

  /**
   * Generate a unique child ID
   */
  static generateChildId(existingAccounts = null) {
    const accounts = existingAccounts || this.getAllAccounts();
    let maxNum = 0;
    accounts.forEach(account => {
      const match = account.childId && account.childId.match(/^kid-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `kid-${maxNum + 1}`;
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

  /**
   * Validate PIN format (4 or 8 digits)
   */
  static validatePin(pin) {
    return /^\d{4}$/.test(pin) || /^\d{8}$/.test(pin);
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
   * Register a new child account
   */
  static async registerChild(fullName, pin) {
    // Validate inputs
    if (!this.validateName(fullName)) {
      throw new Error('Please enter a valid name (1-50 characters).');
    }
    if (!this.validatePin(pin)) {
      throw new Error('PIN must be 4 or 8 digits.');
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
      avatar: 'default',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      progress: {},
      settings: {},
      migrated: false,
    };

    accounts.push(newAccount);
    this.saveAllAccounts(accounts);
    return { childId, fullName: newAccount.fullName };
  }

  /**
   * Login a child with ID and PIN
   */
  static async loginChild(childId, pin) {
    const accounts = this.getAllAccounts();
    const account = accounts.find(a => a.childId === childId);
    
    if (!account) {
      throw new Error('Invalid Child ID or PIN. Please try again.');
    }

    if (!account.pinSet) {
      throw new Error('This account has no PIN set. Please contact a parent.');
    }

    const pinHash = await this.hashPin(pin);
    if (account.pinHash !== pinHash) {
      throw new Error('Invalid Child ID or PIN. Please try again.');
    }

    // Update last login
    account.lastLogin = new Date().toISOString();
    this.saveAllAccounts(accounts);

    // Set as active
    this.setActiveChild(childId);
    return { childId: account.childId, fullName: account.fullName };
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
   * Get active child account
   */
  static getActiveChild() {
    const childId = this.getActiveChildId();
    if (!childId) return null;
    const accounts = this.getAllAccounts();
    return accounts.find(a => a.childId === childId) || null;
  }

  /**
   * Get child by ID
   */
  static getChild(childId) {
    const accounts = this.getAllAccounts();
    return accounts.find(a => a.childId === childId) || null;
  }

  /**
   * Update child account
   */
  static updateChild(childId, updates) {
    const accounts = this.getAllAccounts();
    const index = accounts.findIndex(a => a.childId === childId);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates };
      this.saveAllAccounts(accounts);
      return accounts[index];
    }
    return null;
  }

  /**
   * Delete child account
   */
  static deleteChild(childId) {
    let accounts = this.getAllAccounts();
    accounts = accounts.filter(a => a.childId !== childId);
    this.saveAllAccounts(accounts);
    if (this.getActiveChildId() === childId) {
      this.logoutChild();
    }
  }

  /**
   * Verify PIN for parent zone access
   */
  static async verifyPin(childId, pin) {
    const account = this.getChild(childId);
    if (!account || !account.pinSet) return false;
    const pinHash = await this.hashPin(pin);
    return account.pinHash === pinHash;
  }

  /**
   * Get child progress data
   */
  static getChildProgress(childId, key, defaultValue = null) {
    const account = this.getChild(childId);
    return account?.progress?.[key] ?? defaultValue;
  }

  /**
   * Set child progress data
   */
  static setChildProgress(childId, key, value) {
    const accounts = this.getAllAccounts();
    const index = accounts.findIndex(a => a.childId === childId);
    if (index !== -1) {
      if (!accounts[index].progress) {
        accounts[index].progress = {};
      }
      accounts[index].progress[key] = value;
      this.saveAllAccounts(accounts);
    }
  }

  /**
   * Get all children names and IDs (for parent dashboard)
   */
  static getAllChildrenSummary() {
    return this.getAllAccounts().map(a => ({
      childId: a.childId,
      fullName: a.fullName,
      createdAt: a.createdAt,
      lastLogin: a.lastLogin,
    }));
  }
}