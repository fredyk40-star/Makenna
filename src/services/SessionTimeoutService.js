/**
 * SessionTimeoutService - Manages user session timeout for security
 * Automatically logs out inactive users after a period of time
 */
import { StorageService } from './StorageService';

const TIMEOUT_KEY = 'makenna_session_timeout';
const TIMEOUT_WARNING_KEY = 'makenna_timeout_warning_shown';
const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 60 * 1000; // Warning 1 minute before timeout

class SessionTimeoutService {
  constructor() {
    this.timeoutDuration = DEFAULT_TIMEOUT;
    this.warningTime = WARNING_TIME;
    this.timeoutId = null;
    this.warningTimeoutId = null;
    this.onTimeout = null;
    this.onWarning = null;
    this.isActive = false;
  }

  /**
   * Initialize session timeout
   * @param {number} timeoutMs - Timeout duration in milliseconds
   * @param {Function} onTimeout - Callback when session expires
   * @param {Function} onWarning - Callback when warning should be shown
   */
  init(timeoutMs, onTimeout, onWarning) {
    this.timeoutDuration = timeoutMs || this.timeoutDuration;
    this.onTimeout = onTimeout;
    this.onWarning = onWarning;
    
    // Load saved timeout preference
    const savedTimeout = StorageService.get(TIMEOUT_KEY);
    if (savedTimeout) {
      this.timeoutDuration = savedTimeout;
    }

    this.startSession();
  }

  /**
   * Start monitoring session activity
   */
  startSession() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.resetTimer();
    
    // Listen for user activity
    ['mousedown', 'mousemove', 'keypress', 'touchstart', 'scroll'].forEach(event => {
      window.addEventListener(event, () => this.handleActivity(), { passive: true });
    });
  }

  /**
   * Stop monitoring session
   */
  stopSession() {
    this.isActive = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
    
    ['mousedown', 'mousemove', 'keypress', 'touchstart', 'scroll'].forEach(event => {
      window.removeEventListener(event, () => this.handleActivity());
    });
  }

  /**
   * Handle user activity - reset the timer
   */
  handleActivity() {
    this.resetTimer();
    // Clear warning flag when user is active
    sessionStorage.removeItem(TIMEOUT_WARNING_KEY);
  }

  /**
   * Reset the session timer
   */
  resetTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
    }

    // Set warning timeout
    this.warningTimeoutId = setTimeout(() => {
      if (this.onWarning && !sessionStorage.getItem(TIMEOUT_WARNING_KEY)) {
        sessionStorage.setItem(TIMEOUT_WARNING_KEY, 'true');
        this.onWarning();
      }
    }, this.timeoutDuration - this.warningTime);

    // Set main timeout
    this.timeoutId = setTimeout(() => {
      if (this.onTimeout) {
        this.onTimeout();
      }
    }, this.timeoutDuration);
  }

  /**
   * Set custom timeout duration
   * @param {number} minutes - Timeout in minutes
   */
  setTimeoutDuration(minutes) {
    this.timeoutDuration = minutes * 60 * 1000;
    StorageService.set(TIMEOUT_KEY, this.timeoutDuration);
    this.resetTimer();
  }

  /**
   * Get current timeout in minutes
   */
  getTimeoutMinutes() {
    return this.timeoutDuration / 60000;
  }

  /**
   * Get remaining time until timeout in seconds
   */
  getRemainingTime() {
    // This is approximate since we don't track exact start time
    return Math.floor((this.timeoutDuration - this.warningTime) / 1000);
  }

  /**
   * Check if warning was already shown
   */
  wasWarningShown() {
    return !!sessionStorage.getItem(TIMEOUT_WARNING_KEY);
  }

  /**
   * Clear warning state
   */
  clearWarning() {
    sessionStorage.removeItem(TIMEOUT_WARNING_KEY);
  }
}

// Singleton instance
export const sessionTimeout = new SessionTimeoutService();
export default SessionTimeoutService;