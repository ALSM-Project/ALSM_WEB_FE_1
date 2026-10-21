import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UploadSourcePage } from './UploadSourcePage';

// Bug: whenever the whole upload request was rejected by the backend (e.g. a real,
// specific error like a duplicate filename across subfolders, or the wrong project
// conversion type), every file in the batch was shown with a generic hardcoded
// "Failed to parse" label and the real backend error message was only console.error'd,
// never shown to the user - making a config/data problem look like a parsing bug.
const mocks = vi.hoisted(() => ({
  getScreens: vi.fn(),
  uploadSource: vi.fn(),
  getProjectById: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/features/conversion/services/conversion.service', () => ({
  conversionService: {
    getScreens: mocks.getScreens,
    uploadSource: mocks.uploadSource,
  },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  projectService: {
    getProjectById: mocks.getProjectById,
  },
}));

describe('UploadSourcePage - real upload error surfacing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProjectById.mockResolvedValue(null);
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/projects/proj-acme/upload']}>
        <Routes>
          <Route path="/projects/:projectId/upload" element={<UploadSourcePage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('shows the real backend error message instead of a generic label when an upload is rejected', async () => {
    mocks.getScreens.mockResolvedValue([]);
    mocks.uploadSource.mockRejectedValue(
      new Error(
        'Two different files named "COACTUP.CPY" were selected in this upload (likely from two different subfolders).',
      ),
    );

    renderPage();

    const tab = await screen.findByText('Programs (COBOL / RPG)');
    fireEvent.click(tab);

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const file = new File(['content'], 'COACTUP.CPY', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText(/Two different files named "COACTUP\.CPY"/i)).toBeInTheDocument();
  });

  it('clears the previous error banner once a new upload attempt starts', async () => {
    mocks.getScreens.mockResolvedValue([]);
    mocks.uploadSource.mockRejectedValueOnce(new Error('Duplicate file name conflict.'));

    renderPage();
    const tab = await screen.findByText('Programs (COBOL / RPG)');
    fireEvent.click(tab);

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['a'], 'A.cpy', { type: 'text/plain' })] },
    });
    expect(await screen.findByText('Duplicate file name conflict.')).toBeInTheDocument();

    mocks.uploadSource.mockResolvedValueOnce({
      inputReference: 'ref-1',
      files: [{ name: 'B.cpy', sizeBytes: 100 }],
      screens: [],
    });
    fireEvent.change(fileInput, {
      target: { files: [new File(['b'], 'B.cpy', { type: 'text/plain' })] },
    });

    await waitFor(() => {
      expect(screen.queryByText('Duplicate file name conflict.')).not.toBeInTheDocument();
    });
  });

  it('shows an informative banner and prevents upload when tab does not match project conversion type', async () => {
    mocks.getScreens.mockResolvedValue([]);
    mocks.getProjectById.mockResolvedValue({
      id: 'proj-acme',
      name: 'ACME',
      conversionType: 'BMS_DSPF_TO_FRONTEND',
    });

    renderPage();

    const tab = await screen.findByText('Programs (COBOL / RPG)');
    fireEvent.click(tab);

    expect(
      await screen.findByText('Project is configured for BMS / DSPF → React'),
    ).toBeInTheDocument();

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['cobol content'], 'PROGRAM.cbl', { type: 'text/plain' })] },
    });

    expect(
      await screen.findByText(
        'Cannot upload COBOL/RPG programs to a BMS/DSPF → React project. Please create a "COBOL → Java" project to convert COBOL files.',
      ),
    ).toBeInTheDocument();
    expect(mocks.uploadSource).not.toHaveBeenCalled();
  });
});
