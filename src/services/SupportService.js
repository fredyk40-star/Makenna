/**
 * SupportService - parent PIN-reset requests.
 *
 * Requests are written to the server through api/support.js, where the child
 * ID + parent email pair is checked against the protected account row.
 * Developer actions require a signed developer session token.
 */
import { StorageService } from './StorageService';
import { ChildAccountService, postApi } from './ChildAccountService';
import { DeveloperService } from './DeveloperService';

const SUPPORT_KEY = 'makenna_support_requests_v1';
const MAX_MESSAGE_LENGTH = 1000;

const developerAuth = () => ({ developerToken: DeveloperService.getSessionToken() });

export class SupportService {
  static getRequests() {
    return StorageService.get(SUPPORT_KEY, []).slice().sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  static getOpenCount() {
    return this.getRequests().filter(request => request.status === 'open').length;
  }

  static _save(requests) {
    StorageService.set(SUPPORT_KEY, requests);
  }

  static _merge(request) {
    const requests = this.getRequests();
    const index = requests.findIndex(item => item.id === request.id);
    if (index === -1) requests.unshift(request);
    else requests[index] = { ...requests[index], ...request };
    this._save(requests);
  }

  static async submitRequest({ childId, parentEmail, message }) {
    const normalizedChildId = ChildAccountService.normalizeChildId(childId);
    const normalizedEmail = typeof parentEmail === 'string' ? parentEmail.trim().toLowerCase() : '';

    if (!normalizedChildId || !normalizedEmail || !ChildAccountService.validateEmail(normalizedEmail)) {
      throw new Error('Enter a valid Child ID and parent email.');
    }

    const trimmedMessage = typeof message === 'string' ? message.trim() : '';
    if (trimmedMessage.length < 5 || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Please write a short message (5-${MAX_MESSAGE_LENGTH} characters).`);
    }

    const result = await postApi('support', {
      action: 'submit',
      childId: normalizedChildId,
      parentEmail: normalizedEmail,
      message: trimmedMessage,
    });

    this._merge(result.request);
    this._log('SUPPORT_REQUEST', { childId: result.request.childId, id: result.request.id });
    return result.request;
  }

  static async markStatus(id, status, developerNote = '') {
    const allowed = ['open', 'reviewing', 'resolved'];
    if (!allowed.includes(status)) throw new Error(`Unsupported status: ${status}`);

    const requests = this.getRequests();
    const index = requests.findIndex(request => request.id === id);
    if (index === -1) throw new Error('Support request not found.');

    const updated = {
      ...requests[index],
      status,
      developerNote: developerNote || requests[index].developerNote,
      updatedAt: new Date().toISOString(),
    };

    await postApi('support', {
      action: 'update',
      ...developerAuth(),
      id,
      status,
      developerNote: updated.developerNote,
    });

    this._merge(updated);
    this._log('SUPPORT_REQUEST_UPDATED', { id, status });
    return updated;
  }

  static async deleteRequest(id) {
    await postApi('support', { action: 'delete', ...developerAuth(), id });
    this._save(this.getRequests().filter(request => request.id !== id));
    return true;
  }

  static async syncToCloud() {
    const requests = this.getRequests();
    if (!requests.length) return { success: true, count: 0 };
    try {
      const result = await postApi('support', {
        action: 'sync',
        ...developerAuth(),
        requests,
      });
      return { success: true, count: result.count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async syncFromCloud() {
    try {
      const result = await postApi('support', { action: 'list', ...developerAuth() });
      const cloudRequests = (result.requests || []).map(request => ({
        id: request.id,
        childId: request.childId,
        parentEmail: request.parentEmail,
        message: request.message,
        status: request.status || 'open',
        developerNote: request.developerNote || '',
        createdAt: request.createdAt,
        updatedAt: request.updatedAt || request.createdAt,
      }));

      const byId = new Map();
      this.getRequests().forEach(request => byId.set(request.id, request));
      cloudRequests.forEach(request => {
        const existing = byId.get(request.id);
        if (!existing || new Date(request.updatedAt) >= new Date(existing.updatedAt)) {
          byId.set(request.id, request);
        }
      });

      this._save(Array.from(byId.values()));
      return { success: true, requests: this.getRequests() };
    } catch (error) {
      return { success: false, error: error.message, requests: [] };
    }
  }

  static _log(action, details) {
    try {
      const logs = StorageService.get('makenna_system_logs_v1', []);
      logs.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action,
        details,
      });
      if (logs.length > 500) logs.splice(500);
      StorageService.set('makenna_system_logs_v1', logs);
    } catch (error) {
      console.warn('Support log failed:', error);
    }
  }
}

export default SupportService;
