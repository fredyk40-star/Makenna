/**
 * Lightweight error reporting with offline queueing.
 * Set VITE_ERROR_REPORTING_ENDPOINT to forward reports to your own backend.
 */
const MAX_QUEUED_ERRORS = 50;

class ErrorReportingService {
  constructor() {
    this.queue = [];
    this.endpoint = import.meta.env.VITE_ERROR_REPORTING_ENDPOINT || null;
    this.handlersInstalled = false;
  }

  capture(error, context = {}) {
    const entry = {
      message: error?.message || String(error),
      stack: error?.stack || null,
      context,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      timestamp: new Date().toISOString(),
    };

    this.queue = [...this.queue, entry].slice(-MAX_QUEUED_ERRORS);

    if (import.meta.env.DEV) {
      console.error('[Makenna error report]', entry);
    }

    this.send(entry);
    return entry;
  }

  async send(entry) {
    if (!this.endpoint || typeof fetch !== 'function') return false;

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      });
      return true;
    } catch {
      // Offline: the entry stays in the local queue for a later flush.
      return false;
    }
  }

  async flush() {
    if (!this.endpoint || this.queue.length === 0) return 0;

    const pending = [...this.queue];
    const results = await Promise.allSettled(pending.map(entry => this.send(entry)));
    const sent = results.filter(result => result.status === 'fulfilled' && result.value).length;
    this.queue = pending.slice(sent);
    return sent;
  }

  installGlobalHandlers() {
    if (this.handlersInstalled || typeof window === 'undefined') return;
    this.handlersInstalled = true;

    window.addEventListener('error', (event) => {
      this.capture(event.error || event.message, { source: 'window.error', filename: event.filename });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.capture(event.reason, { source: 'unhandledrejection' });
    });
  }

  getQueue() {
    return [...this.queue];
  }
}

const errorReporter = new ErrorReportingService();
export { ErrorReportingService };
export default errorReporter;
