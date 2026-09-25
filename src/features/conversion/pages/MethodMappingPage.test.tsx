import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { MethodMappingView } from '../types/conversion';
import { MethodMappingPage } from './MethodMappingPage';

// UC-28: this page must show only real detected class/method names (or an honest empty
// state) - never fabricated rows - and must persist a rename through the real backend.
const mocks = vi.hoisted(() => ({
  getMethodMapping: vi.fn(),
  saveMethodMapping: vi.fn(),
}));

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getMethodMapping: mocks.getMethodMapping,
    saveMethodMapping: mocks.saveMethodMapping,
  },
}));

const withGeneratedCode: MethodMappingView = {
  projectId: 'proj-acme',
  screenId: 'scr-cobol',
  hasGeneratedCode: true,
  entries: [
    {
      relativePath: 'cobolprogramclasses/cbact01c/Cbact01cTasklet.java',
      kind: 'CLASS',
      originalName: 'Cbact01cTasklet',
      targetName: 'Cbact01cTasklet',
    },
    {
      relativePath: 'cobolprogramclasses/cbact01c/Cbact01cTasklet.java',
      kind: 'METHOD',
      originalName: 'execute',
      targetName: 'execute',
    },
  ],
  updatedBy: null,
  updatedAt: null,
};

// Original Name (disabled) and Target Name (editable) can briefly share the same display
// value before an override is made — find the one the user can actually type into.
async function findEditableInput(value: string): Promise<HTMLElement> {
  const matches = await screen.findAllByDisplayValue(value);
  const editable = matches.find((el) => !el.hasAttribute('disabled'));
  if (!editable) throw new Error(`No editable input found with value "${value}"`);
  return editable;
}

describe('MethodMappingPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/projects/proj-acme/screens/scr-cobol/method-mapping']}>
        <Routes>
          <Route path="/projects/:projectId/screens/:screenId/method-mapping" element={<MethodMappingPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('shows the real detected class and method names', async () => {
    mocks.getMethodMapping.mockResolvedValue(withGeneratedCode);

    renderPage();

    // Original and target names start equal (no override saved yet), so both a disabled
    // "Original Name" and an editable "Target Name" input show the same value.
    expect(await screen.findAllByDisplayValue('Cbact01cTasklet')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('execute')).toHaveLength(2);
  });

  it('shows an honest empty state instead of fake rows when no COBOL conversion has completed yet', async () => {
    mocks.getMethodMapping.mockResolvedValue({
      projectId: 'proj-acme',
      screenId: 'scr-cobol',
      hasGeneratedCode: false,
      entries: [],
      updatedBy: null,
      updatedAt: null,
    });

    renderPage();

    expect(await screen.findByText(/Run the COBOL→Java conversion for this screen first/i)).toBeInTheDocument();
  });

  it('lets the user rename a class and saves the real override', async () => {
    mocks.getMethodMapping.mockResolvedValue(withGeneratedCode);
    mocks.saveMethodMapping.mockResolvedValue({
      ...withGeneratedCode,
      entries: [
        { ...withGeneratedCode.entries[0], targetName: 'AccountLoaderTasklet' },
        withGeneratedCode.entries[1],
      ],
    });

    renderPage();
    const classInput = await findEditableInput('Cbact01cTasklet');
    fireEvent.change(classInput, { target: { value: 'AccountLoaderTasklet' } });

    const saveButton = screen.getByRole('button', { name: /Save Mapping/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mocks.saveMethodMapping).toHaveBeenCalledWith(
        'proj-acme',
        'scr-cobol',
        expect.arrayContaining([
          expect.objectContaining({ originalName: 'Cbact01cTasklet', targetName: 'AccountLoaderTasklet' }),
        ]),
      );
    });
    expect(await screen.findByText(/saved and applied to the generated code/i)).toBeInTheDocument();
  });

  it('disables saving and shows a validation warning for an invalid Java identifier', async () => {
    mocks.getMethodMapping.mockResolvedValue(withGeneratedCode);

    renderPage();
    const classInput = await findEditableInput('Cbact01cTasklet');
    fireEvent.change(classInput, { target: { value: 'Not A Valid Name' } });

    expect(await screen.findByText(/must be a valid Java identifier/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Mapping/i })).toBeDisabled();
  });

  it('shows a real error banner when saving fails, instead of failing silently', async () => {
    mocks.getMethodMapping.mockResolvedValue(withGeneratedCode);
    mocks.saveMethodMapping.mockRejectedValue(new Error('Conversion queue is not configured'));

    renderPage();
    const saveButton = await screen.findByRole('button', { name: /Save Mapping/i });
    fireEvent.click(saveButton);

    expect(await screen.findByText('Conversion queue is not configured')).toBeInTheDocument();
  });

  it('shows a real error banner instead of nothing when loading the mapping fails', async () => {
    mocks.getMethodMapping.mockRejectedValue(new Error('Request failed'));

    renderPage();

    expect(await screen.findByText('Request failed')).toBeInTheDocument();
  });
});
