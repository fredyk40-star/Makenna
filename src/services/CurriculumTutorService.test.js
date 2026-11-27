import { describe, expect, it, vi } from 'vitest';
import { CurriculumTutorService } from './CurriculumTutorService';

describe('CurriculumTutorService', () => {
  it('is off until a parent enables it', () => {
    expect(CurriculumTutorService.isEnabled('child-1')).toBe(false);
    expect(CurriculumTutorService.getSettings('child-1').allowOnlineAI).toBe(false);
    expect(CurriculumTutorService.getSuggestion('child-1', 'Ama')).toBeNull();
    expect(CurriculumTutorService.answer('child-1', 'vowels')).toBeNull();

    const settings = CurriculumTutorService.saveSettings('child-1', { enabled: true, level: 'KG1' });
    expect(settings.enabled).toBe(true);
    expect(settings.level).toBe('KG1');
    expect(CurriculumTutorService.isEnabled('child-1')).toBe(true);
  });

  it('persists the parent opt-in for online Gemini answers', () => {
    const settings = CurriculumTutorService.saveSettings('child-1', {
      enabled: true,
      allowOnlineAI: true,
    });

    expect(settings.allowOnlineAI).toBe(true);
    expect(CurriculumTutorService.getSettings('child-1').allowOnlineAI).toBe(true);
  });

  it('suggests only allowed curriculum units at the chosen level', () => {
    CurriculumTutorService.saveSettings('child-1', {
      enabled: true,
      level: 'KG1',
      subjects: ['english'],
    });

    const suggestion = CurriculumTutorService.getSuggestion('child-1', 'Kwame Amuah');
    expect(suggestion.unit.subject).toBe('english');
    expect(suggestion.unit.level).toBe('KG1');
    expect(suggestion.unit.source).toBe('english:en1');
    expect(suggestion.text).toContain('Kwame');
    expect(suggestion.text).toContain('Vowels');
    expect(CurriculumTutorService.getUnits('child-1').every((unit) => unit.subject === 'english')).toBe(true);
  });

  it('grounds answers in the matched unit and reports its source', () => {
    CurriculumTutorService.saveSettings('child-1', { enabled: true, level: 'KG1' });
    const response = CurriculumTutorService.answer('child-1', 'Tell me about vowels', 'Ama');

    expect(response.unit.id).toBe('en1');
    expect(response.matched).toBe(true);
    expect(response.text).toContain('Vowels');
    expect(response.text).toContain('vowel sounds');
    expect(response.unit.path).toBe('/alphabet');
  });

  it('does not mark suggestion answers as curriculum matches', () => {
    CurriculumTutorService.saveSettings('child-1', { enabled: true, level: 'KG1' });
    const response = CurriculumTutorService.answer('child-1', 'Tell me a joke');

    expect(response.matched).toBe(false);
  });

  it('notifies subscribers when parent settings change', () => {
    const listener = vi.fn();
    const unsubscribe = CurriculumTutorService.subscribe(listener);
    CurriculumTutorService.saveSettings('child-1', { enabled: true });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    CurriculumTutorService.saveSettings('child-1', { enabled: false });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
