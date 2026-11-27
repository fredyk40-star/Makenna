/**
 * SupportService - Stores parent PIN-reset requests.
 *
 * Requests are written locally first, then queued to Supabase so the developer
 * portal can review them from another device.
 */
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';

const SUPPORT_KEY = 'makenna_support_requests_v1';
const MAX_MESSAGE_LENGTH = 1000;

const makeId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `support-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

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

    // Pull cloud accounts so a request from a new device can still find the child.
    await ChildAccountService.syncAccountsFromCloud();
    const account = ChildAccountService.validateSupportIdentity(normalizedChildId, normalizedEmail);
    if (!account) {
      throw new Error('No account was found with that Child ID and parent email. Check both and try again.');
    }

    const now = new Date().toISOString();
    const request = {
      id: makeId(),
      childId: account.childId,
      fullName: account.fullName,
      parentEmail: normalizedEmail,
      message: trimmedMessage,
      status: 'open',
      developerNote: '',
      createdAt: now,
      updatedAt: now,
    };

    this._save([request, ...this.getRequests()]);
    void this.syncToCloud();
    this._log('SUPPORT_REQUEST', { childId: account.childId, id: request.id });

    return request;
  }

  static markStatus(id, status, developerNote = '') {
    const allowed = ['open', 'reviewing', 'resolved'];
    if (!allowed.includes(status)) throw new Error(`Unsupported status: ${status}`);

    const requests = this.getRequests();
    const index = requests.findIndex(request => request.id === id);
    if (index === -1) throw new Error('Support request not found.');

    requests[index] = {
      ...requests[index],
      status,
      developerNote: developerNote || requests[index].developerNote,
      updatedAt: new Date().toISOString(),
    };
    this._save(requests);
    void this.syncToCloud();
    this._log('SUPPORT_REQUEST_UPDATED', { id, status });
    return requests[index];
  }

  static deleteRequest(id) {
    const requests = this.getRequests().filter(request => request.id !== id);
    this._save(requests);
    void this.deleteFromCloud(id);
    return true;
  }

  static async syncToCloud() {
    const { supabase, isSupabaseConfigured } = await import('./SupabaseService');
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    const requests = this.getRequests();
    try {
      const { error } = await supabase.from('support_requests').upsert(
        requests.map(request => ({
          id: request.id,
          child_id: request.childId,
          parent_email: request.parentEmail,
          message: request.message,
          status: request.status,
          developer_note: request.developerNote || '',
          created_at: request.createdAt,
          updated_at: request.updatedAt,
        })),
        { onConflict: 'id' }
      );
      if (error) throw error;
      return { success: true, count: requests.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async syncFromCloud() {
    const { supabase, isSupabaseConfigured } = await import('./SupabaseService');
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured', requests: [] };
    }

    try {
      const { data, error } = await supabase
        .from('support_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const cloudRequests = (data || []).map(item => ({
        id: item.id,
        childId: item.child_id,
        parentEmail: item.parent_email,
        message: item.message,
        status: item.status || 'open',
        developerNote: item.developer_note || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at || item.created_at,
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

  static async deleteFromCloud(id) {
    const { supabase, isSupabaseConfigured } = await import('./SupabaseService');
    if (!isSupabaseConfigured() || !supabase) return { success: false };
    try {
      const { error } = await supabase.from('support_requests').delete().eq('id', id);
      return { success: !error, error: error?.message };
    } catch (error) {
      return { success: false, error: error.message };
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
