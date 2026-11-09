import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UploadSourcePage } from './UploadSourcePage';

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
    mocks.getProjectById.mockResolvedValue({ id: 'proj-acme', conversionType: 'COBOL_TO_JAVA' });
    mocks.uploadSource.mockRejectedValue(
      new Error(
        'Two different files named "COACTUP.CPY" were selected in this upload (likely from two different subfolders).',
      ),
    );

    renderPage();
    await screen.findByText(/Proceed to Programs List/i);

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const file = new File(['content'], 'COACTUP.CPY', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText(/Two different files named "COACTUP\.CPY"/i)).toBeInTheDocument();
  });

  it('clears the previous error banner once a new upload attempt starts', async () => {
    mocks.getScreens.mockResolvedValue([]);
    mocks.getProjectById.mockResolvedValue({ id: 'proj-acme', conversionType: 'COBOL_TO_JAVA' });
    mocks.uploadSource.mockRejectedValueOnce(new Error('Duplicate file name conflict.'));

    renderPage();
    await screen.findByText(/Proceed to Programs List/i);

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

  it('shows an informative banner and prevents upload when file does not match project conversion type', async () => {
    mocks.getScreens.mockResolvedValue([]);
    mocks.getProjectById.mockResolvedValue({
      id: 'proj-acme',
      name: 'ACME',
      conversionType: 'BMS_DSPF_TO_FRONTEND',
    });

    renderPage();
    await screen.findByText(/Proceed to Screens List/i);

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

describe('UploadSourcePage - loaded files adapted to project type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const loaded = [
    { id: 'p1', projectId: 'proj-acme', name: 'MODEL01.cbl', sourceType: 'COBOL', status: 'Completed', framework: 'Java (Spring Boot)', lastUpdated: 'now' },
    { id: 'p2', projectId: 'proj-acme', name: 'PAYROLL.rpg', sourceType: 'RPG', status: 'Ready', framework: 'Java (Spring Boot)', lastUpdated: 'now' },
    { id: 's1', projectId: 'proj-acme', name: 'LOGIN.bms', sourceType: 'BMS', status: 'Ready', framework: 'React', lastUpdated: 'now' },
  ];

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/projects/proj-acme/upload']}>
        <Routes>
          <Route path="/projects/:projectId/upload" element={<UploadSourcePage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('lists uploaded COBOL programs at once when a COBOL to Java project opens', async () => {
    mocks.getScreens.mockResolvedValue(loaded);
    mocks.getProjectById.mockResolvedValue({ id: 'proj-acme', name: 'Acme', conversionType: 'COBOL_TO_JAVA' });

    renderPage();

    expect(await screen.findByText('MODEL01.cbl')).toBeInTheDocument();
    expect(screen.getByText('PAYROLL.rpg')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN.bms')).not.toBeInTheDocument();
    expect(await screen.findByText(/Proceed to Programs List/i)).toBeInTheDocument();
  });

  it('keeps BMS and DSPF screens for BMS project', async () => {
    mocks.getScreens.mockResolvedValue(loaded);
    mocks.getProjectById.mockResolvedValue({ id: 'proj-acme', name: 'Acme', conversionType: 'BMS_DSPF_TO_FRONTEND' });

    renderPage();

    expect(await screen.findByText('LOGIN.bms')).toBeInTheDocument();
    expect(screen.queryByText('MODEL01.cbl')).not.toBeInTheDocument();
    expect(await screen.findByText(/Proceed to Screens List/i)).toBeInTheDocument();
  });
});
