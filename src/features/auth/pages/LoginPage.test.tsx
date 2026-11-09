import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

const mockLogin = vi.fn();
const mockLoginWithGoogle = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/app/providers', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
  }),
  isUserStaffOrAdmin: () => false,
  isUserPartner: () => false,
  getTargetHandoffUrl: () => null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

describe('LoginPage - Remember Me feature', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders default remember me checked and pre-fills email and password if stored in localStorage', () => {
    localStorage.setItem('alsm_remembered_email', 'admin@admin.com');
    localStorage.setItem('alsm_remembered_password', 'secret123');
    localStorage.setItem('alsm_remember_me_flag', 'true');

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/Enter your work email/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i) as HTMLInputElement;
    const rememberCheckbox = screen.getByLabelText(/Remember me/i) as HTMLInputElement;

    expect(emailInput.value).toBe('admin@admin.com');
    expect(passwordInput.value).toBe('secret123');
    expect(rememberCheckbox.checked).toBe(true);
  });

  it('saves both email and password to localStorage on typing when rememberMe is checked', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/Enter your work email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

    expect(localStorage.getItem('alsm_remembered_email')).toBe('user@example.com');
    expect(localStorage.getItem('alsm_remembered_password')).toBe('mypassword');
  });

  it('saves credentials to localStorage when login succeeds and rememberMe is checked', async () => {
    mockLogin.mockResolvedValueOnce({ id: '1', email: 'test@example.com' });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/Enter your work email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(localStorage.getItem('alsm_remembered_email')).toBe('user@example.com');
      expect(localStorage.getItem('alsm_remembered_password')).toBe('password123');
      expect(localStorage.getItem('alsm_remember_me_flag')).toBe('true');
    });
  });

  it('removes both email and password from localStorage when rememberMe is unchecked', async () => {
    localStorage.setItem('alsm_remembered_email', 'old@example.com');
    localStorage.setItem('alsm_remembered_password', 'oldpassword');
    mockLogin.mockResolvedValueOnce({ id: '1', email: 'old@example.com' });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const rememberCheckbox = screen.getByLabelText(/Remember me/i) as HTMLInputElement;
    fireEvent.click(rememberCheckbox); // uncheck
    expect(rememberCheckbox.checked).toBe(false);
    expect(localStorage.getItem('alsm_remembered_email')).toBeNull();
    expect(localStorage.getItem('alsm_remembered_password')).toBeNull();

    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(localStorage.getItem('alsm_remembered_email')).toBeNull();
      expect(localStorage.getItem('alsm_remembered_password')).toBeNull();
      expect(localStorage.getItem('alsm_remember_me_flag')).toBe('false');
    });
  });
});
