/**
 * ParentGateService - reusable verification for sensitive settings.
 *
 * A parent PIN is created once from the existing child PIN, then stored as a
 * salted hash. Failed attempts are throttled so the gate cannot be brute
 * forced by a child tapping repeatedly.
 */
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';

const PIN_KEY = 'makenna_parent_gate_pin_v1';
const SESSION_KEY = 'makenna_parent_gate_session_v1';
const ATTEMPTS_KEY = 'makenna_parent_gate_attempts_v1';
const SESSION_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const listeners = new Set();

const notify = () => listeners.forEach(listener => {
  try {
    listener();
  } catch (error) {
    console.warn('Parent gate listener failed:', error);
  }
});

export class ParentGateService {
  static subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  static hasPin() {
    return StorageService.has(PIN_KEY);
  }

  static async setPin(pin) {
    if (!ChildAccountService.validatePin(pin)) {
      throw new Error('PIN must be 4 or 8 digits.');
    }
    StorageService.set(PIN_KEY, await ChildAccountService.hashPin(pin));
    StorageService.remove(ATTEMPTS_KEY);
    this.unlock();
    return true;
  }

  static isUnlocked() {
    const session = StorageService.get(SESSION_KEY, null);
    return !!session?.until && new Date(session.until).getTime() > Date.now();
  }

  static unlock() {
    StorageService.set(SESSION_KEY, { until: new Date(Date.now() + SESSION_MS).toISOString() });
    StorageService.remove(ATTEMPTS_KEY);
    notify();
  }

  static lock() {
    StorageService.remove(SESSION_KEY);
    notify();
  }

  static getLockoutRemaining() {
    const attempts = StorageService.get(ATTEMPTS_KEY, null);
    if (!attempts?.until) return 0;
    return Math.max(0, new Date(attempts.until).getTime() - Date.now());
  }

  static async verifyPin(pin) {
    if (this.getLockoutRemaining() > 0) return false;

    let valid = false;
    if (this.hasPin()) {
      const hash = await ChildAccountService.hashPin(pin);
      valid = StorageService.get(PIN_KEY) === hash;
    } else {
      const account = (ChildAccountService.getAllAccounts() || []).find(item => item.pinSet);
      valid = account ? await ChildAccountService.verifyPin(account.childId, pin) : false;
    }

    if (valid) {
      this.unlock();
      return true;
    }

    const attempts = StorageService.get(ATTEMPTS_KEY, { count: 0 });
    const count = (attempts.count || 0) + 1;
    StorageService.set(ATTEMPTS_KEY, {
      count,
      until: count >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null,
    });
    notify();
    return false;
  }
}

export default ParentGateService;
