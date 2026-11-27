import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('../context/ChildAccountContext', () => ({
  useChildAccount: vi.fn(),
}));

import { useChildAccount } from '../context/ChildAccountContext';
import { ChildAccountService } from '../services/ChildAccountService';
import { useNumbersProgress } from './useNumbersProgress';

describe('useNumbersProgress', () => {
  let updateChild;

  beforeEach(() => {
    updateChild = vi.fn();
    useChildAccount.mockReturnValue({
      activeChild: { childId: 'kid00000001', progress: {} },
      childId: 'kid00000001',
      updateChild,
    });
    vi.spyOn(ChildAccountService, 'getChild').mockReturnValue({
      childId: 'kid00000001',
      progress: {},
    });
    vi.spyOn(ChildAccountService, 'getActiveChildId').mockReturnValue('kid00000001');
  });

  it('writes skill progress through the canonical child update path', () => {
    const { result } = renderHook(() => useNumbersProgress());

    act(() => {
      result.current.markSkill('4', 'counting', { accuracy: 90 });
    });

    expect(updateChild).toHaveBeenCalledWith(expect.objectContaining({
      progress: expect.objectContaining({
        numbers_progress: expect.objectContaining({
          skills: expect.objectContaining({
            4: expect.objectContaining({
              counting: expect.objectContaining({ completed: true, accuracy: 90 }),
            }),
          }),
        }),
      }),
    }));
    expect(result.current.isSkillComplete('4', 'counting')).toBe(true);
    expect(result.current.isNumberCompleted('4')).toBe(false);
  });

  it('records game and story progress without writing them as number ids', () => {
    const { result } = renderHook(() => useNumbersProgress());

    act(() => {
      result.current.saveGameResult('count-mangoes', { score: 100, stars: 5 });
      result.current.completeStory('story-6', '6');
    });

    const written = updateChild.mock.calls.at(-1)[0].progress.numbers_progress;
    expect(written.games['count-mangoes'].bestScore).toBe(100);
    expect(written.stories).toContain('story-6');
    expect(written.completed).toEqual([]);
    expect(result.current.isSkillComplete('6', 'story')).toBe(true);
  });
});
