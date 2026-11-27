import { ChildAccountService } from './ChildAccountService';

const removePersonalDetails = (question, fullName) => {
  const safeQuestion = String(question || '');
  const questionWords = new Set((safeQuestion.match(/[\p{L}\p{N}]+/gu) || []).map(word => word.toLowerCase()));
  const nameWords = String(fullName || '').match(/[\p{L}\p{N}]+/gu) || [];
  if (nameWords.some(word => word.length > 1 && questionWords.has(word.toLowerCase()))) return null;
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(safeQuestion)) return null;
  if (/(?:\+?\d[\d\s().-]{6,}\d)/.test(safeQuestion)) return null;
  return safeQuestion.trim();
};

export class GeminiTutorService {
  static async answer(childId, question, localResult, fullName = '', allowOnlineAI = false) {
    if (!allowOnlineAI) return localResult;
    if (!localResult?.matched || !localResult.unit) return localResult;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return localResult;

    const safeQuestion = removePersonalDetails(question, fullName);
    if (!safeQuestion || safeQuestion.length > 500) return localResult;

    const token = ChildAccountService.getChildToken(childId);
    if (!token) return localResult;

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          token,
          question: safeQuestion,
          unit: {
            title: localResult.unit.title,
            content: localResult.unit.content,
            level: localResult.unit.level,
            subject: localResult.unit.subject,
          },
        }),
      });
      if (!response.ok) return localResult;

      const data = await response.json();
      const text = typeof data?.text === 'string' ? data.text.trim() : '';
      if (!data.success || !text || text.length > 600) return localResult;

      return { ...localResult, text };
    } catch {
      console.warn('Gemini tutor unavailable; using the local curriculum answer.');
      return localResult;
    }
  }
}

export default GeminiTutorService;
