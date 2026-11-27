/**
 * CertificateService - persistent achievement certificates.
 *
 * Certificates are issued once and kept per child so they can be reprinted
 * or downloaded later from the portfolio shelf.
 */
import { StorageService } from './StorageService';

const CERTIFICATES_KEY = 'makenna_certificates_v1';
const MAX_CERTIFICATES_PER_CHILD = 20;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('Certificate listener failed:', error);
    }
  });
};

const readAll = () => {
  const data = StorageService.get(CERTIFICATES_KEY, {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
};

const writeAll = (all) => {
  if (!StorageService.set(CERTIFICATES_KEY, all)) return false;
  notify();
  return true;
};

const toISO = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export class CertificateService {
  static subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  static list(childId) {
    if (!childId) return [];
    const records = readAll()[childId];
    if (!Array.isArray(records)) return [];
    return [...records].sort((a, b) => {
      const aTime = new Date(a?.createdAt).getTime() || 0;
      const bTime = new Date(b?.createdAt).getTime() || 0;
      return bTime - aTime;
    });
  }

  static issue(childId, spec = {}) {
    if (!childId) return null;

    const certificate = {
      id: spec.id || `certificate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      childId,
      title: String(spec.title || 'Alphabet Adventure Graduate').slice(0, 100),
      childName: String(spec.childName || 'Learner').slice(0, 60),
      date: toISO(spec.date),
      stars: Math.max(0, Number(spec.stars) || 0),
      readingLevel: String(spec.readingLevel || 'Emerging Reader').slice(0, 60),
      achievement: String(spec.achievement || 'Completing the Alphabet Adventure').slice(0, 120),
      createdAt: new Date().toISOString(),
    };

    const all = readAll();
    const records = Array.isArray(all[childId]) ? all[childId] : [];
    const next = [certificate, ...records.filter((item) => item?.id !== certificate.id)]
      .slice(0, MAX_CERTIFICATES_PER_CHILD);

    return writeAll({ ...all, [childId]: next }) ? certificate : null;
  }

  static remove(childId, certificateId) {
    if (!childId || !certificateId) return false;
    const all = readAll();
    const records = Array.isArray(all[childId]) ? all[childId] : [];
    const next = records.filter((item) => item?.id !== certificateId);
    if (next.length === records.length) return false;
    return writeAll({ ...all, [childId]: next });
  }

  static clear(childId) {
    if (!childId) return false;
    const all = readAll();
    if (!Array.isArray(all[childId]) || all[childId].length === 0) return false;
    return writeAll({ ...all, [childId]: [] });
  }
}

export default CertificateService;
