import { describe, expect, it, vi } from 'vitest';
import { CertificateService } from './CertificateService';

describe('CertificateService', () => {
  it('issues a certificate with normalized fields', () => {
    const certificate = CertificateService.issue('child-1', {
      title: 'Alphabet Adventure Graduate',
      childName: 'Ama',
      date: '2026-01-01T00:00:00.000Z',
      stars: 26,
      readingLevel: 'Growing Reader',
      achievement: 'Mastered 26 letters',
    });

    expect(certificate.childName).toBe('Ama');
    expect(certificate.stars).toBe(26);
    expect(certificate.date).toBe('2026-01-01T00:00:00.000Z');
    expect(CertificateService.list('child-1')).toEqual([certificate]);
  });

  it('rejects invalid dates and missing children', () => {
    const certificate = CertificateService.issue('child-1', { childName: 'Ama', date: 'not-a-date' });
    expect(Number.isNaN(new Date(certificate.date).getTime())).toBe(false);
    expect(CertificateService.issue('', { childName: 'Ama' })).toBeNull();
  });

  it('removes certificates and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = CertificateService.subscribe(listener);
    const certificate = CertificateService.issue('child-1', { childName: 'Ama' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(CertificateService.remove('child-1', certificate.id)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(CertificateService.list('child-1')).toEqual([]);

    unsubscribe();
    CertificateService.issue('child-1', { childName: 'Ama' });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
