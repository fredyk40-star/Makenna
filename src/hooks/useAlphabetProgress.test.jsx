import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('../context/ChildAccountContext', () => ({
  useChildAccount: vi.fn(),
}));

import { useChildAccount } from '../context/ChildAccountContext';
import { ChildAccountService } from '../services/ChildAccountService';
import { useAlphabetProgress } from './useAlphabetProgress';

describe('useAlphabetProgress', () => {
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

  it('writes alphabet progress through the canonical child update path', () => {
    const { result } = renderHook(() => useAlphabetProgress());

    act(() => {
      result.current.markSkill('a', 'word-with-sound', { accuracy: 90 });
    });

    expect(updateChild).toHaveBeenCalledWith(expect.objectContaining({
      progress: expect.objectContaining({
        alphabet_progress: expect.objectContaining({
          skills: expect.objectContaining({
            a: expect.objectContaining({
              wordWithSound: expect.objectContaining({ completed: true, accuracy: 90 }),
            }),
          }),
        }),
      }),
    }));
    expect(result.current.isSkillComplete('a', 'wordWithSound')).toBe(true);
  });
});
