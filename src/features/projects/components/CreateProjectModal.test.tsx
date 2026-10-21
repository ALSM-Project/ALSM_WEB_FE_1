import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CreateProjectModal } from './CreateProjectModal';

// Bug: the modal always submitted conversionType: 'BMS_DSPF_TO_FRONTEND' with no way for
// the user to pick COBOL_TO_JAVA - every project ever created through this modal silently
// became a BMS/DSPF project regardless of what the user actually wanted to convert.
const mocks = vi.hoisted(() => ({
  createProject: vi.fn(),
}));

vi.mock('../services/project.service', () => ({
  projectService: {
    createProject: mocks.createProject,
  },
}));

describe('CreateProjectModal - conversion type selection', () => {
  beforeEach(() => {
    mocks.createProject.mockReset();
  });

  const renderModal = (onProjectCreated = vi.fn()) =>
    render(
      <MemoryRouter>
        <CreateProjectModal isOpen onClose={vi.fn()} onProjectCreated={onProjectCreated} />
      </MemoryRouter>,
    );

  it('defaults to BMS / DSPF and submits it when the user does not change the selection', async () => {
    mocks.createProject.mockResolvedValue({ id: 'proj-1', name: 'Test' });
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Core Banking Modernization/i), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      expect(mocks.createProject).toHaveBeenCalledWith(
        expect.objectContaining({ conversionType: 'BMS_DSPF_TO_FRONTEND' }),
      );
    });
  });

  it('lets the user pick COBOL -> Java and submits that instead', async () => {
    mocks.createProject.mockResolvedValue({ id: 'proj-2', name: 'Test Cobol' });
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Core Banking Modernization/i), {
      target: { value: 'Test Cobol' },
    });
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);

    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      expect(mocks.createProject).toHaveBeenCalledWith(
        expect.objectContaining({ conversionType: 'COBOL_TO_JAVA' }),
      );
    });
  });

  it('surfaces client-side validation error when project name is shorter than 2 characters', async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Core Banking Modernization/i), {
      target: { value: 'a' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    expect(await screen.findByText(/name must be longer than or equal to 2 characters/i)).toBeInTheDocument();
    expect(mocks.createProject).not.toHaveBeenCalled();
  });

  it('surfaces detailed backend validation errors from ApiError', async () => {
    const { ApiError } = await import('@/services/api/apiError');
    mocks.createProject.mockRejectedValue(
      new ApiError('Request validation failed', 400, ['name must be longer than or equal to 2 characters'], 'VALIDATION_ERROR')
    );
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Core Banking Modernization/i), {
      target: { value: 'ab' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    expect(await screen.findByText('name must be longer than or equal to 2 characters')).toBeInTheDocument();
  });
});
