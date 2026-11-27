/**
 * SessionTimeoutService - idle timeout with a warning and PIN-to-resume lock.
 *
 * The service owns its own timer and state; the overlay only renders what the
 * service reports. Any real pointer/key activity resets the idle clock.
 */
import { StorageService } from './StorageService';

const CONFIG_KEY = 'makenna_session_timeout_v1';

const DEFAULT_CONFIG = {
  enabled: false,
  minutes: 15,
  warningSeconds: 60,
};

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'mousemove'];

const listeners = new Set();
let config = { ...DEFAULT_CONFIG };
let phase = 'active';
let lastActivity = Date.now();
let warningShown = false;
let timer = null;
let started = false;

const notify = () => listeners.forEach(listener => {
  try {
    listener(getState());
  } catch (error) {
    console.warn('Session timeout listener failed:', error);
  }
});

const sanitize = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const minutes = Math.min(180, Math.max(1, Number(source.minutes) || DEFAULT_CONFIG.minutes));
  const warningSeconds = Math.min(300, Math.max(10, Number(source.warningSeconds) || DEFAULT_CONFIG.warningSeconds));
  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : DEFAULT_CONFIG.enabled,
    minutes,
    warningSeconds,
  };
};

export function getConfig() {
  return { ...config };
}

export function getState() {
  const timeoutMs = config.minutes * 60 * 1000;
  const elapsed = Date.now() - lastActivity;
  return {
    phase,
    enabled: config.enabled,
    remainingSeconds: Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000)),
    warningSeconds: config.warningSeconds,
  };
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function recordActivity() {
  if (phase === 'locked') return;
  lastActivity = Date.now();
  warningShown = false;
  if (phase === 'warning') phase = 'active';
  notify();
}

function tick() {
  if (!config.enabled || phase === 'locked') return;

  const timeoutMs = config.minutes * 60 * 1000;
  const elapsed = Date.now() - lastActivity;

  if (elapsed >= timeoutMs) {
    phase = 'locked';
    notify();
    return;
  }

  if (!warningShown && elapsed >= timeoutMs - (config.warningSeconds * 1000)) {
    warningShown = true;
    phase = 'warning';
  }

  notify();
}

export function configure(updates = {}) {
  config = sanitize({ ...config, ...updates });
  StorageService.set(CONFIG_KEY, config);
  lastActivity = Date.now();
  warningShown = false;
  phase = 'active';
  notify();
  return getConfig();
}

export function lock() {
  phase = 'locked';
  notify();
}

export function unlock() {
  phase = 'active';
  lastActivity = Date.now();
  warningShown = false;
  notify();
}

export function start() {
  config = sanitize(StorageService.get(CONFIG_KEY, DEFAULT_CONFIG));
  if (started || typeof document === 'undefined') return;
  started = true;

  ACTIVITY_EVENTS.forEach(event => document.addEventListener(event, recordActivity, { passive: true }));
  timer = window.setInterval(tick, 1000);
}

export function stop() {
  if (!started) return;
  ACTIVITY_EVENTS.forEach(event => document.removeEventListener(event, recordActivity));
  window.clearInterval(timer);
  timer = null;
  started = false;
}

export function reset() {
  stop();
  config = { ...DEFAULT_CONFIG };
  phase = 'active';
  lastActivity = Date.now();
  warningShown = false;
  StorageService.remove(CONFIG_KEY);
}

// Load persisted settings as soon as the module is imported.
config = sanitize(StorageService.get(CONFIG_KEY, DEFAULT_CONFIG));

export const SessionTimeoutService = {
  start,
  stop,
  reset,
  configure,
  getConfig,
  getState,
  subscribe,
  recordActivity,
  lock,
  unlock,
};

export default SessionTimeoutService;
