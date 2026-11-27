import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CelebrationPopup from './CelebrationPopup';
import { voiceGuide } from '../../services/VoiceGuideService';

describe('CelebrationPopup child ID acknowledgement', () => {
  beforeEach(() => {
    vi.spyOn(voiceGuide, 'init').mockImplementation(() => {});
    vi.spyOn(voiceGuide, 'speakRepeated').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('requires the new child to copy and acknowledge their ID before continuing', async () => {
    const onClose = vi.fn();

    render(
      <CelebrationPopup
        isOpen
        onClose={onClose}
        childName="Ama"
        childId="kid20345635"
        requireAcknowledgement
      />,
    );

    const continueButton = screen.getByLabelText('Got it, continue');
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Copy child ID'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('kid20345635'));
    expect(screen.getByText('✅ Copied!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
