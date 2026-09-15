import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TwoFactorAuthenticationPage } from './TwoFactorAuthenticationPage';

const mocks = vi.hoisted(() => ({
  setup2FA: vi.fn(),
  confirm2FA: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('../services/account.service', () => ({
  accountService: {
    setup2FA: mocks.setup2FA,
    confirm2FA: mocks.confirm2FA,
  },
}));

vi.mock('@/app/providers', () => ({
  useAuth: () => ({ refreshUser: mocks.refreshUser }),
}));

const backupCodes = ['9821-4410', '1102-5893'];
const writeText = vi.fn();

const renderBackupCodesStep = async () => {
  render(<TwoFactorAuthenticationPage />);

  fireEvent.click(await screen.findByRole('button', { name: /next: verify code/i }));
  fireEvent.change(screen.getByLabelText(/authenticator code/i), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: /verify & enable/i }));

  await screen.findByText('Emergency Backup Codes');
};

describe('TwoFactorAuthenticationPage backup-code copy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.setup2FA.mockResolvedValue({ secretKey: 'TEST-SECRET' });
    mocks.confirm2FA.mockResolvedValue({ enabled: true, backupCodes });
    mocks.refreshUser.mockResolvedValue(null);
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies backup codes and shows a non-blocking success toast without using browser alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert');

    await renderBackupCodesStep();
    fireEvent.click(screen.getByRole('button', { name: /copy codes/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(backupCodes.join('\n'));
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Backup codes copied to clipboard');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows a safe error toast when copying backup codes fails', async () => {
    writeText.mockRejectedValue(new Error('clipboard unavailable'));

    await renderBackupCodesStep();
    fireEvent.click(screen.getByRole('button', { name: /copy codes/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to copy backup codes');
  });

  it('does not display backup-code values in the success toast', async () => {
    await renderBackupCodesStep();
    fireEvent.click(screen.getByRole('button', { name: /copy codes/i }));

    const toast = await screen.findByRole('status');
    expect(toast).not.toHaveTextContent(backupCodes[0]);
    expect(toast).not.toHaveTextContent(backupCodes[1]);
  });

  it('automatically dismisses the toast after three seconds', async () => {
    await renderBackupCodesStep();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: /copy codes/i }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('status')).toHaveTextContent('Backup codes copied to clipboard');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
